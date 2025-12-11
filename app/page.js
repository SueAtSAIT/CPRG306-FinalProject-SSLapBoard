"use client";

import Image from "next/image";
import { Icon } from "@iconify-icon/react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Speed Skating Lap Board
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            For Best Results:
          </p>
          <ul className="list-disc">
            <li>use on iPad in Landscape orientation.</li>
            <li>
              go fullscreen with
              <Icon icon="humbleicons:expand" alt="Go Fullscreen" height="21" />
            </li>
            <li>on iPad, swipe down to exit fullscreen, or use X</li>
            <li>select skater by armband colour*</li>

            <li>colour scheme can be updated in settings*</li>
            <li>
              click Launch to automatically connect to Calgary Olympic Oval
              timing system*
            </li>
            <li>connection status indicator blinking - go to Manual Mode*</li>
          </ul>
          <p>* feature not yet implemented</p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="./laps"
            target="_blank"
            rel="noopener noreferrer">
            <Image
              className="dark:invert"
              src="/timer-flash-line.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Launch
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="#"
            target="_blank"
            rel="noopener noreferrer">
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
