"use client";

import Image from "next/image";
import { Icon } from "@iconify-icon/react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-16 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Speed Skating Lap Board
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-50">
            For Best Results:
          </p>
          <ul className="list-disc">
            <li>use on iPad in Landscape orientation.</li>
            <li>
              go fullscreen with{" "}
              <Icon icon="humbleicons:expand" alt="Go Fullscreen" height="15" />
            </li>
            <li>
              on iPad, swipe down to exit fullscreen, or use X, or{" "}
              <Icon icon="ant-design:fullscreen-exit-outlined" height="15" />
            </li>
            <li>
              select skater by active (live timing system) armband colour{" "}
              <Icon
                icon="clarity:circle-solid"
                height="15"
                style={{ color: "#ff0000" }}
              />{" "}
            </li>
            <li>
              if no active skaters indicated{" "}
              <Icon
                icon="clarity:ban-line"
                height="15"
                style={{ color: "#ff0000" }}
              />{" "}
              use Manual Mode <Icon icon="simple-line-icons:plus" height="15" />{" "}
              <Icon icon="simple-line-icons:minus" height="15" />
            </li>
            <li>
              colour scheme can be updated in settings{" "}
              <Icon icon="humbleicons:cog" alt="Settings" height="15" />
            </li>
            <li>
              click <span className="font-bold">Launch</span> to automatically
              connect to the
              <span className="font-extrabold"> Calgary Olympic Oval</span>{" "}
              timing system
            </li>
          </ul>
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
