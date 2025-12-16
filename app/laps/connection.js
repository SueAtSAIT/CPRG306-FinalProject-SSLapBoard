// SignalR connection utilities for Next.js React client
// Tries ASP.NET Core SignalR first; falls back to legacy ASP.NET SignalR 2.4.x when detected.

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const DEFAULT_HUB_URL = "http://STCAL-COMP-WEB.knes.ucalgary.ca:5264/signalr";

const ASPNET_SERVER_ERROR_TEXT =
  "Detected a connection attempt to an ASP.NET SignalR Server";

let legacyClientPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      if (existing.complete) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
}

async function ensureLegacyClient() {
  if (legacyClientPromise) return legacyClientPromise;
  // jQuery + ASP.NET SignalR 2.4.x client from CDN
  legacyClientPromise = (async () => {
    await loadScript("https://code.jquery.com/jquery-3.6.0.min.js");
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/2.4.3/jquery.signalR.min.js"
    );
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
export async function startLapFeed(connection, onLapArray) {
  if (!connection) throw new Error("Connection not provided");

  // Register client handler that server invokes with an array of timingData
  connection.on("SendLiveLapboardData", (timingDataArray) => {
    try {
      const laps = Array.isArray(timingDataArray)
        ? timingDataArray.map(normalizeTimingData)
        : [];
      onLapArray?.(laps);
    } catch (e) {
      console.error("Lap handler error", e);
    }
  });

  await connection.start();

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
      connection.off("SendLiveLapboardData");
      connection.stop();
    } catch {}
  };
}

async function startLegacyLapFeed(hubUrl, onLapArray) {
  const $ = await ensureLegacyClient();

  const connection = $.hubConnection(hubUrl);
  const proxy = connection.createHubProxy("LiveLTTimingDataHub");

  proxy.on("SendLiveLapboardData", (timingDataArray) => {
    try {
      const laps = Array.isArray(timingDataArray)
        ? timingDataArray.map(normalizeTimingData)
        : [];
      onLapArray?.(laps);
    } catch (e) {
      console.error("Lap handler error (legacy)", e);
    }
  });

  await connection.start();
  try {
    await proxy.invoke("SubscribeLiveLapboardDataForLapboard");
  } catch (e) {
    console.warn("Legacy subscribe failed or not required", e?.message);
  }

  return () => {
    try {
      proxy.off("SendLiveLapboardData");
      connection.stop();
    } catch {}
  };
}

// Auto-detect server type and connect
export async function startLapFeedAuto(onLapArray, hubUrl = DEFAULT_HUB_URL) {
  // If the path looks like legacy (/signalr), prefer legacy immediately to avoid noisy errors
  if (hubUrl.toLowerCase().includes("/signalr")) {
    return await startLegacyLapFeed(hubUrl, onLapArray);
  }

  // Prefer modern client; if ASP.NET detected, fall back to legacy client
  try {
    const connection = createConnection(hubUrl);
    return await startLapFeed(connection, onLapArray);
  } catch (e) {
    const message = e?.message || "";
    if (message.includes(ASPNET_SERVER_ERROR_TEXT)) {
      console.warn("ASP.NET SignalR detected, switching to legacy client");
      return await startLegacyLapFeed(hubUrl, onLapArray);
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
