"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import {
  startLapFeedAuto,
  parseLapDigits,
  isConnectionActive,
} from "./connection";

// TODO: add color settings for numbers
// TODO: add dark mode effect / intentionally set foreground & background now that explicit font colour set

// TODO: SignalR feed / mockup of it
// TODO: add stateful lane indicators that become active when feed indicates that skater is active
// (ie: white, red light up for a pair of skaters, blue & yellow stay dim; the actively selected skater gets a thicker border)

export default function Lapboard({
  secondsColour,
  tenthsColour,
  manualMode,
  darkMode,
  onManualModeToggle,
  onSettingsClick,
  liveFeedActive,
}) {
  const initialValue = 5;
  const [seconds, setSeconds] = useState(initialValue);
  const [tenths, setTenths] = useState(initialValue);
  const [activeColours, setActiveColours] = useState({}); // { White: true, Red: true, ... }
  const [selectedColour, setSelectedColour] = useState(null); // one of White, Red, Yellow, Blue
  const [liveActive, setLiveActive] = useState(false);
  const [lastLapByColour, setLastLapByColour] = useState({}); // { White: {LapTime, ...}, ... }
  const [isConnected, setIsConnected] = useState(false); // SignalR connection status
  const [connectionAttempts, setConnectionAttempts] = useState(0); // Track connection attempts
  const handle = useFullScreenHandle();

  const incrementSeconds = () => {
    console.log("seconds + clicked");
    setSeconds((prev) => (prev + 1) % 10);
  };
  const decrementSeconds = () => {
    console.log("seconds - clicked");
    setSeconds((prev) => (prev - 1 + 10) % 10);
  };

  const incrementTenths = () => {
    console.log("tenths + clicked");
    setTenths((prev) => (prev + 1) % 10);
  };
  const decrementTenths = () => {
    console.log("tenths - clicked");
    setTenths((prev) => (prev - 1 + 10) % 10);
  };

  // Establish SignalR feed
  useEffect(() => {
    let dispose = null;
    startLapFeedAuto(
      (lapsByColour) => {
        // lapsByColour is already organized: { White: {...}, Red: {...}, etc. }
        const active = {};
        Object.entries(lapsByColour).forEach(([colour, lap]) => {
          if (lap && lap.EventType === "Lap") {
            active[colour] = true;
          }
        });

        setActiveColours(active);
        setLastLapByColour(lapsByColour);
        setLiveActive(Object.keys(lapsByColour).length > 0);

        // If no selection yet, pick the first active colour
        if (!selectedColour) {
          const first = Object.keys(active)[0];
          if (first) setSelectedColour(first);
        }

        // Update displayed digits from selected colour
        const selectedLap = selectedColour
          ? lapsByColour[selectedColour]
          : null;
        if (selectedLap?.LapTime != null) {
          const { secondsDigit, tenthsDigit } = parseLapDigits(
            selectedLap.LapTime,
          );
          if (Number.isFinite(secondsDigit)) setSeconds(secondsDigit);
          if (Number.isFinite(tenthsDigit)) setTenths(tenthsDigit);
        }
      },
      undefined,
      (status) => {
        setIsConnected(status);
        if (status) {
          setConnectionAttempts(0);
          console.log("[Lapboard] SignalR connection established");
        } else {
          console.log("[Lapboard] SignalR connection lost");
        }
      },
    )
      .then((cleanup) => {
        dispose = cleanup;
      })
      .catch((e) => {
        console.warn(
          "Live feed unavailable; staying in manual mode",
          e?.message,
        );
        setIsConnected(false);
      });

    return () => {
      if (dispose) dispose();
    };
  }, [selectedColour]);

  // Poll connection status: 5s initial, then 30s after first check
  useEffect(() => {
    let pollInterval = null;
    let isFirstPoll = true;

    const pollConnection = () => {
      const status = isConnectionActive();
      setIsConnected(status);

      // After first poll, switch to 30-second interval
      if (isFirstPoll) {
        isFirstPoll = false;
        clearInterval(pollInterval);
        pollInterval = setInterval(pollConnection, 30000); // 30 seconds
      }
    };

    // Start with 5-second poll
    pollInterval = setInterval(pollConnection, 5000);
    // Check immediately on mount
    pollConnection();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return (
    <>
      <FullScreen handle={handle}>
        <div
          className={`w-full h-full flex flex-col ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}>
          <div className="absolute top-8 left-8 flex flex-col gap-3 z-10">
            <button
              type="button"
              onClick={() => (handle.active ? handle.exit() : handle.enter())}
              className={`p-3 rounded-lg transition-colors ${
                darkMode
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              aria-label={
                handle.active ? "Exit Fullscreen" : "Enter Fullscreen"
              }>
              <Icon
                icon={
                  handle.active
                    ? "ant-design:fullscreen-exit-outlined"
                    : "humbleicons:expand"
                }
                alt={handle.active ? "Exit Fullscreen" : "Enter Fullscreen"}
                height="36"
              />
            </button>
            {/* skater selector icons when active and inactive (no feed received): */}
            {/* TODO: add skater selection to buttons with an indicator to show which is selected and times being displayed */}
            <button
              onClick={() => setSelectedColour("White")}
              className={`${
                selectedColour === "White" ? "ring-2 ring-gray-500" : ""
              }`}
              aria-label="Select White">
              {(liveFeedActive ?? liveActive) ? (
                activeColours["White"] ? (
                  <Icon icon="openmoji:white-circle" height="40" />
                ) : (
                  <Icon
                    icon="clarity:ban-line"
                    height="40"
                    style={{ color: darkMode ? "#ffffff" : "#000000" }}
                  />
                )
              ) : (
                <Icon
                  icon="clarity:ban-line"
                  height="40"
                  style={{ color: darkMode ? "#ffffff" : "#000000" }}
                />
              )}
            </button>

            <button
              onClick={() => setSelectedColour("Red")}
              className={`${
                selectedColour === "Red" ? "ring-2 ring-red-400" : ""
              }`}
              aria-label="Select Red">
              {(liveFeedActive ?? liveActive) ? (
                activeColours["Red"] ? (
                  <Icon
                    icon="clarity:circle-solid"
                    height="40"
                    style={{ color: "#ff0000" }}
                  />
                ) : (
                  <Icon
                    icon="clarity:ban-line"
                    height="40"
                    style={{ color: "#ff0000" }}
                  />
                )
              ) : (
                <Icon
                  icon="clarity:ban-line"
                  height="40"
                  style={{ color: "#ff0000" }}
                />
              )}
            </button>
            <button
              onClick={() => setSelectedColour("Yellow")}
              className={`${
                selectedColour === "Yellow" ? "ring-2 ring-yellow-300" : ""
              }`}
              aria-label="Select Yellow">
              {(liveFeedActive ?? liveActive) ? (
                activeColours["Yellow"] ? (
                  <Icon
                    icon="clarity:circle-solid"
                    height="40"
                    style={{ color: "#f4e641" }}
                  />
                ) : (
                  <Icon
                    icon="clarity:ban-line"
                    height="40"
                    style={{ color: "#f4e641" }}
                  />
                )
              ) : (
                <Icon
                  icon="clarity:ban-line"
                  height="40"
                  style={{ color: "#f4e641" }}
                />
              )}
            </button>
            <button
              onClick={() => setSelectedColour("Blue")}
              className={`${
                selectedColour === "Blue" ? "ring-2 ring-blue-400" : ""
              }`}
              aria-label="Select Blue">
              {(liveFeedActive ?? liveActive) ? (
                activeColours["Blue"] ? (
                  <Icon
                    icon="clarity:circle-solid"
                    height="40"
                    style={{ color: "#1037df" }}
                  />
                ) : (
                  <Icon
                    icon="clarity:ban-line"
                    height="40"
                    style={{ color: "#1037df" }}
                  />
                )
              ) : (
                <Icon
                  icon="clarity:ban-line"
                  height="40"
                  style={{ color: "#1037df" }}
                />
              )}
            </button>
          </div>
          <div className="absolute bottom-8 left-8 flex flex-col gap-3 z-10">
            <button
              onClick={onSettingsClick}
              className={`p-3 rounded-lg transition-colors ${
                darkMode
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="Settings">
              <Icon icon="humbleicons:cog" height="36" />
            </button>
          </div>
          <div
            className="absolute top-8 right-8 flex items-center gap-2 z-10 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: darkMode
                ? "rgba(31, 41, 55, 0.8)"
                : "rgba(243, 244, 246, 0.8)",
              backdropFilter: "blur(4px)",
            }}>
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
            <span
              className={`text-sm font-medium ${
                isConnected
                  ? darkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : darkMode
                    ? "text-red-400"
                    : "text-red-600"
              }`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
            {selectedColour && lastLapByColour[selectedColour] && (
              <div className="text-center">
                <p
                  className="text-xs pointer-events-none"
                  style={{
                    fontSize: "10px",
                    opacity: 0.7,
                    color: darkMode ? "#d1d5db" : "#374151",
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                  {lastLapByColour[selectedColour].Name}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <div className="flex-1 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={incrementSeconds}
                  disabled={liveFeedActive}
                  className={`p-3 rounded-lg transition-colors ${
                    liveFeedActive
                      ? "cursor-not-allowed text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500"
                      : darkMode
                        ? "hover:bg-gray-800 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600"
                  }`}>
                  <Icon icon="simple-line-icons:plus" height="36" />
                </button>
                <p
                  className="text-[40rem] leading-none tracking-tighter pointer-events-none -mt-20 -mb-10"
                  style={{
                    fontWeight: 900,
                    color: secondsColour,
                    WebkitTextStroke: `0.5px ${secondsColour}`,
                  }}>
                  {seconds}
                </p>
                <button
                  type="button"
                  onClick={decrementSeconds}
                  disabled={liveFeedActive}
                  className={`p-3 rounded-lg transition-colors ${
                    liveFeedActive
                      ? "cursor-not-allowed text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500"
                      : darkMode
                        ? "hover:bg-gray-800 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600"
                  }`}>
                  <Icon icon="simple-line-icons:minus" height="36" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={incrementTenths}
                  disabled={liveFeedActive}
                  className={`p-3 rounded-lg transition-colors ${
                    liveFeedActive
                      ? "cursor-not-allowed text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500"
                      : darkMode
                        ? "hover:bg-gray-800 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600"
                  }`}>
                  <Icon icon="simple-line-icons:plus" height="36" />
                </button>

                <p
                  className="text-[40rem] leading-none tracking-tighter pointer-events-none -mt-20 -mb-10"
                  style={{
                    fontWeight: 900,
                    color: tenthsColour,
                    WebkitTextStroke: `0.5px ${tenthsColour}`,
                  }}>
                  {tenths}
                </p>
                <button
                  type="button"
                  onClick={decrementTenths}
                  disabled={liveFeedActive}
                  className={`p-3 rounded-lg transition-colors ${
                    liveFeedActive
                      ? "cursor-not-allowed text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500"
                      : darkMode
                        ? "hover:bg-gray-800 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600"
                  }`}>
                  <Icon icon="simple-line-icons:minus" height="36" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </FullScreen>
    </>
  );
}
