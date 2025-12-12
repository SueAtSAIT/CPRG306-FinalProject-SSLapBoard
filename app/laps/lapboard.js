"use client";

import { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

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
            <button>
              {liveFeedActive ? (
                <Icon icon="openmoji:white-circle" height="40" />
              ) : (
                <Icon
                  icon="clarity:ban-line"
                  height="40"
                  style={{ color: darkMode ? "#ffffff" : "#000000" }}
                />
              )}
            </button>

            <button>
              {liveFeedActive ? (
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
              )}
            </button>
            <button>
              {liveFeedActive ? (
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
              )}
            </button>
            <button>
              {liveFeedActive ? (
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
              )}
            </button>
            {/* TODO: remove manual mode if auto-detect skater feed can render the correct skater colours and disable the plus/minus buttons */}
            {/* <button
              onClick={() => onManualModeToggle(!manualMode)}
              className={`p-3 rounded-lg transition-colors ${
                manualMode
                  ? "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
              aria-label="Toggle manual mode"
              title={manualMode ? "Manual Mode ON" : "Live Feed Mode"}>
              <Icon icon="la:hand-pointer" height="36" />
            </button> */}
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
          <div className="flex-1 flex items-center justify-center gap-2 px-6">
            <div className="flex-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={incrementSeconds}
                disabled={liveFeedActive}
                className={`p-3 rounded-lg transition-colors ${
                  liveFeedActive
                    ? "opacity-30 cursor-not-allowed"
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
                    ? "opacity-30 cursor-not-allowed"
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
                    ? "opacity-30 cursor-not-allowed"
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
                    ? "opacity-30 cursor-not-allowed"
                    : darkMode
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}>
                <Icon icon="simple-line-icons:minus" height="36" />
              </button>
            </div>
          </div>
        </div>
      </FullScreen>
    </>
  );
}
