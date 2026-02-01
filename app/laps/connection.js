// SignalR connection utilities for Next.js React client
// Tries ASP.NET Core SignalR first; falls back to legacy ASP.NET SignalR 2.4.x when detected.

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const DEFAULT_HUB_URL = "http://STCAL-COMP-WEB.knes.ucalgary.ca:5264/signalr";

const ASPNET_SERVER_ERROR_TEXT =
  "Detected a connection attempt to an ASP.NET SignalR Server";

// Connection state tracking
let currentConnection = null;
let connectionStarted = false;

let legacyClientPromise = null;

// Check if SignalR connection is active
export function isConnectionActive() {
  if (!currentConnection) return false;

  // Check connection state for modern SignalR
  if (currentConnection.state !== undefined) {
    return currentConnection.state === 1; // HubConnectionState.Connected = 1
  }

  // Check connection state for legacy SignalR
  if (currentConnection.state !== undefined) {
    return currentConnection.state === 1; // ConnectionState.Connected = 1
  }

  return connectionStarted;
}

async function ensureLegacyClient() {
  if (legacyClientPromise) return legacyClientPromise;
  legacyClientPromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("Legacy SignalR requires a browser environment");
    }

    const { default: jQuery } = await import("jquery");
    // Assign to globals for the SignalR client to attach
    window.jQuery = window.$ = jQuery;

    await import("signalr");

    if (!window.$ || !window.$.hubConnection) {
      throw new Error("Legacy SignalR client failed to load");
    }
    return window.$;
  })();
  return legacyClientPromise;
}

export function createConnection(hubUrl = DEFAULT_HUB_URL) {
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  return connection;
}

// Normalizes timing data for Lap events, matching legacy formatTimingData2
export function normalizeTimingData(timingData) {
  if (!timingData) return null;
  if (timingData.EventType === "Lap") {
    return {
      ...timingData,
      EventType: timingData.EventType,
      GroupId: timingData.GroupID ?? timingData.GroupId,
      Name: timingData.Name,
      Velocity:
        typeof timingData.Velocity === "number"
          ? timingData.Velocity.toFixed(2)
          : timingData.Velocity,
      LapCnt: timingData.LapCnt,
      LapTime: timingData.LapTime, // expected like "1:23.45" or seconds
      SetLapCnt: timingData.SetLapCnt,
      Location: timingData.Location,
      LapEndTime: timingData.LapEndTime,
    };
  }
  return {
    ...timingData,
    EventType: timingData.EventType,
    GroupId: timingData.GroupID ?? timingData.GroupId,
    Name: timingData.Name,
    Desc: timingData.Desc,
  };
}

// Helper: subscribe to server method that streams lapboard data
// server method name may differ; using "SendLiveLapboardData" client callback
export async function startLapFeed(
  connection,
  onLapArray,
  onConnectionStatus,
  onColorActivity,
) {
  if (!connection) throw new Error("Connection not provided");

  currentConnection = connection;
  connectionStarted = false;
  if (onConnectionStatus) onConnectionStatus(false);

  // Keep track of active colors across messages
  let currentActiveColours = {};

  // Register client handler that server invokes with an array of timingData
  connection.on("SendLiveLapboardData", (timingDataArray) => {
    try {
      const laps = Array.isArray(timingDataArray)
        ? timingDataArray.map(normalizeTimingData)
        : [];

      // Organize lap data by GroupID (color)
      const lapsByColour = {};
      const activeColourUpdates = {}; // Only Show/Hide updates in this message
      let hasColorUpdates = false;

      laps.forEach((lap) => {
        // Handle ShowColor/HideColor events based on EventType
        if (lap?.EventType?.startsWith("Show")) {
          const colour = lap.EventType.replace("Show", ""); // "ShowRed" -> "Red"
          activeColourUpdates[colour] = true;
          currentActiveColours[colour] = true;
          hasColorUpdates = true;
          console.log(`[SignalR] Show event: ${colour}`);

          if (lap?.Name) {
            lapsByColour[colour] = {
              ...lap,
              GroupId: colour,
              LapTime: null,
            };
          }
        } else if (lap?.EventType?.startsWith("Hide")) {
          const colour = lap.EventType.replace("Hide", ""); // "HideRed" -> "Red"
          activeColourUpdates[colour] = false;
          currentActiveColours[colour] = false;
          hasColorUpdates = true;
          console.log(`[SignalR] Hide event: ${colour}`);
        }

        if (lap?.EventType !== "Lap") {
          const colour = lap.GroupId || lap.GroupID;
          if (colour && lap?.Name && !lapsByColour[colour]) {
            lapsByColour[colour] = {
              ...lap,
              GroupId: colour,
              LapTime: null,
            };
          }
        }

        // Handle Lap events for lap data
        if (lap?.EventType === "Lap") {
          const colour = lap.GroupId || lap.GroupID;
          if (colour) {
            lapsByColour[colour] = lap;
          }
        }
      });

      // Notify about color activity if callback provided and we have Show/Hide events
      if (onColorActivity && hasColorUpdates) {
        console.log("[SignalR] Callback invoked with:", activeColourUpdates);
        onColorActivity(activeColourUpdates);
      }

      // Always call onLapArray with the lap data (may be empty if no Lap events)
      onLapArray?.(lapsByColour);
    } catch (e) {
      console.error("Lap handler error", e);
    }
  });

  await connection.start();
  connectionStarted = true;
  if (onConnectionStatus) onConnectionStatus(true);

  // Attempt to subscribe to server feed if available
  try {
    if (connection.invoke) {
      await connection.invoke("SubscribeLiveLapboardDataForLapboard");
    }
  } catch (e) {
    // Keep connection alive even if server does not require explicit subscribe
    console.warn("Subscribe call failed or not required", e?.message);
  }

  return () => {
    try {
      connectionStarted = false;
      if (onConnectionStatus) onConnectionStatus(false);
      connection.off("SendLiveLapboardData");
      connection.stop();
    } catch {}
  };
}

function normalizeLegacyUrl(url) {
  // Ensure single /signalr suffix and prefer http if no protocol specified
  let normalized = url || DEFAULT_HUB_URL;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/g, "");
  // Ensure exactly one /signalr at the end
  if (!/\/signalr$/i.test(normalized)) {
    normalized = `${normalized}/signalr`;
  }
  return normalized;
}

async function startLegacyLapFeed(
  hubUrl,
  onLapArray,
  onConnectionStatus,
  onColorActivity,
) {
  const $ = await ensureLegacyClient();
  console.log("[SignalR] startLegacyLapFeed started", { hubUrl });
  connectionStarted = false;
  if (onConnectionStatus) onConnectionStatus(false);

  // Keep track of active colors across messages
  let currentActiveColours = {};

  // If running in a secure context (https), route via same-origin proxy to avoid HTTPS upgrade/mixed content issues in browsers like Chrome
  // Can be overridden by NEXT_PUBLIC_DIRECT_SIGNALR for direct connections (when server is browser-accessible)
  const shouldProxy =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    /^http:/i.test(hubUrl || DEFAULT_HUB_URL) &&
    process.env.NEXT_PUBLIC_DIRECT_SIGNALR !== "true";
  const baseUrl = shouldProxy
    ? "/api/signalr-proxy"
    : normalizeLegacyUrl(hubUrl);

  console.log("[SignalR] Legacy connection config", {
    shouldProxy,
    baseUrl,
    isSecureContext: window?.isSecureContext,
    directMode: process.env.NEXT_PUBLIC_DIRECT_SIGNALR === "true",
  });

  const connection = $.hubConnection(baseUrl, { useDefaultPath: false });
  const proxy = connection.createHubProxy("LiveLTTimingDataHub");

  const onLap = (timingDataArray) => {
    try {
      const laps = Array.isArray(timingDataArray)
        ? timingDataArray.map(normalizeTimingData)
        : [];

      // Organize lap data by GroupID (color)
      const lapsByColour = {};
      const activeColourUpdates = {}; // Only Show/Hide updates in this message
      let hasColorUpdates = false;

      laps.forEach((lap) => {
        // Handle ShowColor/HideColor events based on EventType
        if (lap?.EventType?.startsWith("Show")) {
          const colour = lap.EventType.replace("Show", ""); // "ShowRed" -> "Red"
          activeColourUpdates[colour] = true;
          currentActiveColours[colour] = true;
          hasColorUpdates = true;
          console.log(`[SignalR] Show event: ${colour}`);

          if (lap?.Name) {
            lapsByColour[colour] = {
              ...lap,
              GroupId: colour,
              LapTime: null,
            };
          }
        } else if (lap?.EventType?.startsWith("Hide")) {
          const colour = lap.EventType.replace("Hide", ""); // "HideRed" -> "Red"
          activeColourUpdates[colour] = false;
          currentActiveColours[colour] = false;
          hasColorUpdates = true;
          console.log(`[SignalR] Hide event: ${colour}`);
        }

        if (lap?.EventType !== "Lap") {
          const colour = lap.GroupId || lap.GroupID;
          if (colour && lap?.Name && !lapsByColour[colour]) {
            lapsByColour[colour] = {
              ...lap,
              GroupId: colour,
              LapTime: null,
            };
          }
        }

        // Handle Lap events for lap data
        if (lap?.EventType === "Lap") {
          const colour = lap.GroupId || lap.GroupID;
          if (colour) {
            lapsByColour[colour] = lap;
          }
        }
      });

      // Notify about color activity if callback provided and we have Show/Hide events
      if (onColorActivity && hasColorUpdates) {
        console.log("[SignalR] Callback invoked with:", activeColourUpdates);
        onColorActivity(activeColourUpdates);
      }

      onLapArray?.(lapsByColour);
    } catch (e) {
      console.error("Lap handler error (legacy)", e);
    }
  };

  console.log("[SignalR] Registering SendLiveLapboardData handler");
  proxy.on("SendLiveLapboardData", onLap);

  try {
    // Disable WebSockets when using proxy (Next.js API routes don't support WS upgrades)
    const startOptions = shouldProxy
      ? { transport: ["serverSentEvents", "longPolling"] }
      : {};
    await connection.start(startOptions);
    connectionStarted = true;
    currentConnection = connection;
    if (onConnectionStatus) onConnectionStatus(true);
    try {
      await proxy.invoke("SubscribeLiveLapboardDataForLapboard");
    } catch (e) {
      console.warn("Legacy subscribe failed or not required", e?.message);
    }
  } catch (err) {
    console.error("[SignalR] Connection start failed", { error: err?.message });
    // If https fails, retry over http once
    if (/^https:/i.test(baseUrl)) {
      const httpUrl = baseUrl.replace(/^https:/i, "http:");
      console.warn(
        "[SignalR] Retrying legacy SignalR over http due to SSL error",
      );
      const retryConn = $.hubConnection(httpUrl, { useDefaultPath: false });
      const retryProxy = retryConn.createHubProxy("LiveLTTimingDataHub");
      retryProxy.on("SendLiveLapboardData", onLap);
      await retryConn.start();
      connectionStarted = true;
      currentConnection = retryConn;
      if (onConnectionStatus) onConnectionStatus(true);
      try {
        await retryProxy.invoke("SubscribeLiveLapboardDataForLapboard");
      } catch (e) {
        console.warn(
          "[SignalR] Legacy subscribe failed or not required (retry)",
          e?.message,
        );
      }
      return () => {
        try {
          connectionStarted = false;
          if (onConnectionStatus) onConnectionStatus(false);
          retryProxy.off("SendLiveLapboardData");
          retryConn.stop();
        } catch {}
      };
    }
    throw err;
  }
  console.log("[SignalR] Legacy feed fully started and subscribed");

  return () => {
    try {
      connectionStarted = false;
      if (onConnectionStatus) onConnectionStatus(false);
      proxy.off("SendLiveLapboardData");
      connection.stop();
    } catch {}
  };
}

// Auto-detect server type and connect
export async function startLapFeedAuto(
  onLapArray,
  hubUrl = DEFAULT_HUB_URL,
  onConnectionStatus,
  onColorActivity,
) {
  // If the path looks like legacy (/signalr), prefer legacy immediately to avoid noisy errors
  if (hubUrl.toLowerCase().includes("/signalr")) {
    return await startLegacyLapFeed(
      hubUrl,
      onLapArray,
      onConnectionStatus,
      onColorActivity,
    );
  }

  // Prefer modern client; if ASP.NET detected, fall back to legacy client
  try {
    const connection = createConnection(hubUrl);
    return await startLapFeed(
      connection,
      onLapArray,
      onConnectionStatus,
      onColorActivity,
    );
  } catch (e) {
    const message = e?.message || "";
    if (message.includes(ASPNET_SERVER_ERROR_TEXT)) {
      console.warn("ASP.NET SignalR detected, switching to legacy client");
      return await startLegacyLapFeed(
        hubUrl,
        onLapArray,
        onConnectionStatus,
        onColorActivity,
      );
    }
    throw e;
  }
}

// Parse a lap time string like "1:23.45" into { secondsDigit, tenthsDigit }
export function parseLapDigits(lapTime) {
  if (!lapTime && lapTime !== 0)
    return { secondsDigit: null, tenthsDigit: null };
  // Accept number seconds or formatted mm:ss.xx
  let totalSeconds;
  if (typeof lapTime === "number") {
    totalSeconds = lapTime;
  } else if (typeof lapTime === "string") {
    const parts = lapTime.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const secondsFloat = parseFloat(parts[1]) || 0;
      totalSeconds = minutes * 60 + secondsFloat;
    } else {
      totalSeconds = parseFloat(lapTime) || 0;
    }
  } else {
    return { secondsDigit: null, tenthsDigit: null };
  }

  const secondsDigit = Math.floor(totalSeconds) % 10;
  const tenthsDigit = Math.floor((totalSeconds % 1) * 10);
  return { secondsDigit, tenthsDigit };
}
