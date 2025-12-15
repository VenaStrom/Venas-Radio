"use client";

import { AudioLinesIcon } from "lucide-react";
import { useState } from "react";

export function Title() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div
      className="flex flex-row items-center justify-center gap-1 select-none"
      onClick={(e) => {
        e.preventDefault();
        setClickCount((prevCount) => prevCount + 1);
        setTimeout(() => setClickCount(0), 2000); // Reset count after 2 seconds

        if (clickCount + 1 >= 5) {
          alert("Dumped local storage to clipboard");
          setClickCount(0);
          navigator.clipboard.writeText(JSON.stringify(localStorage));
        }
      }}
    >
      <AudioLinesIcon />
      <p className="font-bold text-lg">VR</p>
    </div>
  );
}