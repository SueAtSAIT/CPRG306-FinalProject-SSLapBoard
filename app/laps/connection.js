// SignalR connection utilities for Next.js React client
// Uses @microsoft/signalr instead of jQuery SignalR

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const DEFAULT_HUB_URL = "http://STCAL-COMP-WEB.knes.ucalgary.ca:5264/signalr";

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

// Parse a lap time string like "1:23.45" into { secondsDigit, tenthsDigit }
export function parseLapDigits(lapTime) {
  if (!lapTime && lapTime !== 0) return { secondsDigit: null, tenthsDigit: null };
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
