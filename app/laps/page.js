"use client";
import { useState, useEffect } from "react";
import Lapboard from "./lapboard";
import Settings from "./settings";

export default function Page() {
  // TODO: signalR connection
  // TODO: settings (number colours, dark mode)

  const [manualMode, setManualMode] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [secondsColour, setSecondsColour] = useState("#000000");
  const [tenthsColour, setTenthsColour] = useState("#EF4444");
  const [showSettings, setShowSettings] = useState(false);
  const [liveFeedActive, setLiveFeedActive] = useState(false);

  useEffect(() => {
    if (!manualMode) {
      // TODO: Connect to WebSocket
      // const ws = new WebSocket('ws://your-websocket-url');
      // ws.onmessage = (event) => {
      //   const data = JSON.parse(event.data);
      // need to get the group = colour, then the lap time, then parse into seconds and tenths
      // which don't be data.seconds but just seconds variable... placeholder for now.
      //   setSeconds(data.seconds);
      //   setTenths(data.tenths);
      // };
      // return () => ws.close();
      console.log("WebSocket mode activated - connect to live feed here");
    }
  }, [manualMode]);

  return (
    <div className="w-screen h-screen bg-white overflow-hidden relative">
      {showSettings ? (
        <Settings
          secondsColour={secondsColour}
          tenthsColour={tenthsColour}
          darkMode={darkMode}
          onSecondsColorChange={setSecondsColour}
          onTenthsColorChange={setTenthsColour}
          onDarkModeToggle={setDarkMode}
          onClose={() => setShowSettings(false)}
        />
      ) : (
        <Lapboard
          secondsColour={secondsColour}
          tenthsColour={tenthsColour}
          // indicators={indicators}
          // selectedIndicator={selectedIndicator}
          manualMode={manualMode}
          darkMode={darkMode}
          // onIndicatorSelect={setSelectedIndicator}
          onManualModeToggle={setManualMode}
          onSettingsClick={() => setShowSettings(true)}
          liveFeedActive={liveFeedActive}
        />
      )}

      {/* <Lapboard /> */}
    </div>
  );
}
