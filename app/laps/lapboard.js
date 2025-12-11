"use client";

import { useState } from "react";
import { Icon } from "@iconify-icon/react";

export default function Lapboard() {
  // const [skater, setSkater] = useState[("White", "Red", "Yellow", "Blue")];
  const initialValue = 5;
  const [seconds, setSeconds] = useState(initialValue);
  const [tenths, setTenths] = useState(initialValue);

  const incrementSeconds = () => {
    console.log("seconds + clicked");
    setSeconds((prev) => prev + 1);
  };
  const decrementSeconds = () => {
    console.log("seconds - clicked");
    setSeconds((prev) => prev - 1);
  };

  const incrementTenths = () => {
    console.log("tenths + clicked");
    setTenths((prev) => prev + 1);
  };
  const decrementTenths = () => {
    console.log("tenths - clicked");
    setTenths((prev) => prev - 1);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center gap-8 px-16">
        <div className="flex-1 flex flex-col items-center gap-4">
          <button type="button" onClick={incrementSeconds}>
            <Icon icon="simple-line-icons:plus" height="36" />
          </button>
          <p
            className="text-[40rem] leading-none tracking-tighter pointer-events-none"
            style={{ fontWeight: 900 }}>
            {seconds}
          </p>
          <button type="button" onClick={decrementSeconds}>
            <Icon icon="simple-line-icons:minus" height="36" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center gap-4">
          <button type="button" onClick={incrementTenths}>
            <Icon icon="simple-line-icons:plus" height="36" />
          </button>

          <p
            className="text-[40rem] leading-none tracking-tighter pointer-events-none"
            style={{ fontWeight: 900 }}>
            {tenths}
          </p>
          <button type="button" onClick={decrementTenths}>
            <Icon icon="simple-line-icons:minus" height="36" />
          </button>
        </div>
      </div>
    </div>
  );
}
