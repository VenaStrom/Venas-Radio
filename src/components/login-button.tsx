"use client";

import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

function LoggedInSkeleton() {
  return (
    <div className="flex flex-row items-center gap-3 me-1">
      {/* Name */}
      <div className={`bg-gray-700 w-[10ch] h-4 rounded-sm`}></div>
      {/* Avatar */}
      <div className={`bg-gray-700 size-10 rounded-full`}></div>
    </div>
  );
}

export function LoginButton() {
  return (
    <div className={`flex flex-row items-center justify-center`}>
      <Suspense fallback={<LoggedInSkeleton />}>
        <SignedOut>
          <SignInButton>
            <button
              className={`
                h-8 w-fit
                rounded-lg
                flex flex-row items-center justify-center
                gap-x-2 px-6 py-2.5
                font-bold no-underline
                cursor-pointer
                bg-[#5865f2] text-white 
                hover:text-white hover:drop-shadow-lg
              `}
            >
              <Image
                width={24} height={24}
                src="/icons/discord/discord-white.svg"
                className="size-5"
                alt="Discord"
              />
              Logga in
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <button
            className={`
              flex flex-row  justify-center items-center 
              gap-x-2 
              bg-zinc-700 hover:bg-zinc-600
              rounded-lg px-3 py-1.5
              cursor-pointer
            `}
          >
            <UserButton
              fallback={<LoggedInSkeleton />}
              appearance={{
                layout: { shimmer: false },
                elements: {
                  userButtonBox: `!me-0`,
                }
              }}
            />
            Inloggad
          </button>
        </SignedIn>
      </Suspense>
    </div>
  )
}