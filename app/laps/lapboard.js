"use client";

import { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

// TODO: add color settings
// TODO: add dark mode effect

export default function Lapboard() {
  // const [skater, setSkater] = useState[("White", "Red", "Yellow", "Blue")];
  const initialValue = 5;
  const [seconds, setSeconds] = useState(initialValue);
  const [tenths, setTenths] = useState(initialValue);
  // const lightmode = "fontWeight: 900";
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
      <div>
        <button type="button" onClick={handle.enter}>
          <Icon icon="humbleicons:expand" alt="Go Fullscreen" height="36" />
        </button>
      </div>
      <FullScreen handle={handle}>
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center gap-2 px-6">
            <div className="flex-1 flex flex-col items-center gap-2">
              <button type="button" onClick={incrementSeconds}>
                <Icon icon="simple-line-icons:plus" height="36" />
              </button>
              <p
                className="text-[40rem] leading-none tracking-tighter pointer-events-none -mt-20 -mb-10"
                style={{
                  fontWeight: 900,
                  color: "black",
                  WebkitTextStroke: "0.5px black",
                }}>
                {seconds}
              </p>
              <button type="button" onClick={decrementSeconds}>
                <Icon icon="simple-line-icons:minus" height="36" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <button type="button" onClick={incrementTenths}>
                <Icon icon="simple-line-icons:plus" height="36" />
              </button>

              <p
                className="text-[40rem] leading-none tracking-tighter pointer-events-none -mt-20 -mb-10"
                style={{
                  fontWeight: 900,
                  color: "black",
                  WebkitTextStroke: "0.5px black",
                }}>
                {tenths}
              </p>
              <button type="button" onClick={decrementTenths}>
                <Icon icon="simple-line-icons:minus" height="36" />
              </button>
            </div>
          </div>
        </div>
      </FullScreen>
    </>
  );
}
