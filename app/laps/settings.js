"use client";

import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";

export default function Settings({
  secondsColour,
  tenthsColour,
  darkMode,
  onSecondsColorChange,
  onTenthsColorChange,
  onDarkModeToggle,
  onClose,
}) {
  const [localSecondsColour, setLocalSecondsColour] = useState(secondsColour);
  const [localTenthsColour, setLocalTenthsColour] = useState(tenthsColour);

  return (
    <div
      className={`w-full h-full overflow-auto p-12 ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1 className={`text-6xl ${darkMode ? "text-white" : "text-black"}`}>
            Settings
          </h1>
          <button
            onClick={onClose}
            className={`p-4 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Close settings">
            <Icon icon="ep:close-bold" className="w-10 h-10" />
          </button>
        </div>
        <div
          className="mb-12 pb-8 border-b-2"
          style={{ borderColor: darkMode ? "#374151" : "#E5E7EB" }}>
          <div className="flex items-center justify-between">
            <label
              className={`text-3xl ${darkMode ? "text-white" : "text-black"}`}>
              {darkMode ? "Dark Mode" : "Light Mode"}
            </label>
            <button
              onClick={() => onDarkModeToggle(!darkMode)}
              className={`flex items-center gap-4 px-8 py-6 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}>
              {darkMode ? (
                <>
                  <Icon icon="majesticons:moon-line" className="w-8 h-8" />
                  <span className="text-3xl">Dark</span>
                </>
              ) : (
                <>
                  <Icon icon="octicon:sun-24" className="w-8 h-8" />
                  <span className="text-3xl">Light</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="space-y-8 mb-12">
          <div className="flex items-center gap-6">
            <input
              type="color"
              value={localSecondsColour}
              onChange={(e) => {
                setLocalSecondsColour(e.target.value);
                onSecondsColorChange(e.target.value);
              }}
              className="w-24 h-24 rounded-lg cursor-pointer border-2 border-gray-300"
            />
            <span
              className={`text-2xl ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}>
              {localSecondsColour}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <input
              type="color"
              value={localTenthsColour}
              onChange={(e) => {
                setLocalTenthsColour(e.target.value);
                onTenthsColorChange(e.target.value);
              }}
              className="w-24 h-24 rounded-lg cursor-pointer border-2 border-gray-300"
            />
            <span
              className={`text-2xl ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}>
              {localTenthsColour}
            </span>
          </div>
        </div>
        <div
          className="pt-8 border-t-2"
          style={{ borderColor: darkMode ? "#374151" : "#E5E7EB" }}></div>
      </div>
    </div>
  );
}
