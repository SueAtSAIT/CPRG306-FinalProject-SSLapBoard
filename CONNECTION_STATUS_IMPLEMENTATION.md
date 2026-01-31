# SignalR Connection Status Implementation

## Overview

This document outlines the connection status monitoring system implemented for the SignalR lap board application.

## Changes Made

### 1. **connection.js** - Connection Status Tracking

#### New Functions:

- **`isConnectionActive()`** - Checks if the SignalR connection is currently active
  - Returns `true` if connection state is "Connected" (state === 1)
  - Supports both modern and legacy SignalR connections

#### Enhanced Functions:

- **`startLapFeed()`** - Now accepts optional `onConnectionStatus` callback
  - Calls callback with `true` when connection starts
  - Calls callback with `false` when connection stops/disconnects
- **`startLegacyLapFeed()`** - Now accepts optional `onConnectionStatus` callback
  - Tracks connection state for legacy SignalR 2.4.x
  - Supports retry connection tracking
- **`startLapFeedAuto()`** - Signature updated

  ```javascript
  startLapFeedAuto(onLapArray, hubUrl, onConnectionStatus);
  ```

  - Third parameter passes status callbacks to internal functions

#### Connection State Management:

- `currentConnection` - Stores reference to active connection object
- `connectionStarted` - Boolean flag for connection state

---

### 2. **lapboard.js** - UI Connection Status Display

#### New State Variables:

```javascript
const [isConnected, setIsConnected] = useState(false); // Connection status
const [connectionAttempts, setConnectionAttempts] = useState(0); // For future retry tracking
```

#### New Effects:

1. **SignalR Feed Effect** (Enhanced)
   - Now passes `onConnectionStatus` callback to `startLapFeedAuto()`
   - Updates `isConnected` state when connection changes
   - Resets `connectionAttempts` counter on successful connection

2. **Connection Polling Effect** (New)
   - **Initial behavior**: Polls every 5 seconds
   - **After first successful check**: Switches to 30-second polling
   - Calls `isConnectionActive()` to verify connection status
   - Cleans up interval on component unmount

#### UI Display:

- **Location**: Top-right corner of the screen
- **Appearance**:
  - Green dot + "Connected" text when connected
  - Red dot + "Disconnected" text when disconnected
  - Green dot has pulse animation when connected
  - Semi-transparent background with backdrop blur for visibility
  - Dark mode and light mode support

---

## Current Retry Behavior

### Modern SignalR (ASP.NET Core)

- Built-in automatic reconnection via `withAutomaticReconnect()`
- Logs to console with `LogLevel.Information`

### Legacy SignalR (ASP.NET 2.4.x)

1. **Initial Connection**: Attempts to connect to specified hub URL
2. **HTTPS Fallback**: If HTTPS connection fails, automatically retries over HTTP
3. **Proxy Support**: Routes through `/api/signalr-proxy` when:
   - Browser is in secure context (HTTPS)
   - Target server uses HTTP (mixed content prevention)

### Error Handling

- If initial connection fails, the app logs a warning and remains in manual mode
- Connection status is displayed to user via the new indicator
- Does not automatically restart the entire feed

---

## Polling Strategy

| Phase             | Interval   | Purpose                                               |
| ----------------- | ---------- | ----------------------------------------------------- |
| Initial           | 5 seconds  | Detect connection status quickly after startup        |
| After First Check | 30 seconds | Reduce polling frequency once baseline is established |

This balances responsiveness with performance - quick detection at startup, then lighter polling.

---

## Status Callback Flow

```
startLapFeedAuto()
  ├─ onConnectionStatus(false)  [Initial: disconnected]
  ├─ [Connection attempt]
  ├─ onConnectionStatus(true)   [Connected successfully]
  │
  └─ [On disconnect]
      └─ onConnectionStatus(false)
```

---

## Testing the Connection Status

1. **On Page Load**:
   - Watch the indicator change from "Disconnected" (red) to "Connected" (green)
   - Should happen within 5 seconds

2. **With Live Server**:
   - When SignalR server is running, indicator should be green and pulsing
   - When lap data arrives, indicator remains green and active

3. **Without Live Server**:
   - Indicator should remain red "Disconnected"
   - App remains in manual mode

4. **Network Interruption** (if testing):
   - Disconnect network and wait for next 5-second poll
   - Indicator should change to red within 5 seconds
   - Reconnect network and it should return to green within 5 seconds

---

## Future Enhancements

- [ ] Retry exponential backoff for better network resilience
- [ ] Connection attempt counter display
- [ ] Last connection time display
- [ ] Manual reconnect button
- [ ] Connection error logging to UI
- [ ] Adaptive polling based on connection stability
