import "./global.tw.css";
import { isObj } from "@/types";
import type React from "react";

export function App(): React.ReactNode {
  async function fetchApi() {
    const res = await fetch("/api/hello");
    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }
    const json = await res.json() as unknown;
    if (!isObj(json)) {
      throw new Error("API response is not an object");
    }
    console.log({ json });
  }

  return (
    <main>
      Hello world!

      Ping port 3000 to see the API response.

      <button onClick={() => {
        fetchApi()
          .catch((err: unknown) => {
            console.error("Error fetching API:", err);
            alert("Failed to fetch API. Check console for details.");
          });
      }}>
        Ping API
      </button>
    </main>
  );
}