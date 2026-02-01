# Vercel Deployment Guide - SignalR Connection Issues

## Problem

The application works locally but fails on Vercel with a 502 Bad Gateway error when trying to connect to the SignalR server at `stcal-comp-web.knes.ucalgary.ca:5264`.

## Root Cause

The SignalR server is likely on an internal network that is not accessible from Vercel's serverless infrastructure. Your local machine can access it (with the hosts file entry), but Vercel's servers cannot.

## Solutions

### Option 1: Make SignalR Server Publicly Accessible (Recommended)

If you control the SignalR server infrastructure:

1. **Expose the server through a public IP or domain**
   - Configure your firewall to allow connections from Vercel's IP ranges
   - Or use a VPN/tunnel solution like ngrok, Cloudflare Tunnel, or similar

2. **Set Vercel Environment Variables**
   Go to your Vercel project settings → Environment Variables and add:

   ```
   SIGNALR_LEGACY_BASE=http://your-public-ip:5264/signalr
   SIGNALR_LEGACY_HOST=stcal-comp-web.knes.ucalgary.ca
   ```

3. **Redeploy** your application after setting environment variables

### Option 2: Direct Client Connection (if server is browser-accessible)

If the SignalR server is accessible directly from user browsers (but not from Vercel):

1. **Set environment variable to bypass proxy**:

   ```
   NEXT_PUBLIC_DIRECT_SIGNALR=true
   ```

2. **Modify connection.js** to skip proxy for direct connections (see code modification below)

### Option 3: Use Different Network Setup

- Deploy to a platform that can access your internal network (e.g., self-hosted, or a VPS within your network)
- Use a VPN connection between Vercel and your network (complex setup)

## Code Modification for Option 2 (Direct Connection)

If you want to allow direct connections from the browser, you can modify the proxy detection logic:

```javascript
// In app/laps/connection.js, around line 230
const shouldProxy =
  typeof window !== "undefined" &&
  window.isSecureContext &&
  /^http:/i.test(hubUrl || DEFAULT_HUB_URL) &&
  !process.env.NEXT_PUBLIC_DIRECT_SIGNALR; // Add this condition
```

This will skip the proxy when the environment variable is set, allowing direct browser-to-server connections (which may work if your users are on the same network as the server).

## Testing

After implementing a solution:

1. Check Vercel logs for the proxy errors
2. Test the connection from different networks
3. Verify the SignalR negotiation succeeds

## Network Requirements

For the connection to work:

- Vercel → SignalR Server (for proxy mode)
- User Browser → SignalR Server (for direct mode)

One or both of these paths must be open depending on your chosen solution.

## Current Configuration

The proxy route is configured to:

- Target: `http://stcal-comp-web.knes.ucalgary.ca:5264/signalr`
- Timeout: 9 seconds (to stay under Vercel's 10s limit)
- Supports both modern and legacy SignalR protocols
