import { isObj } from "@/types";
import "./global.tw.css";
import type React from "react";

export function App(): React.ReactNode {
  async function fetchApi() {
    const res = await fetch("/api/hello");
    const rawBody = await res.text();

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}: ${rawBody.slice(0, 160)}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON but received '${contentType || "unknown"}': ${rawBody.slice(0, 160)}`);
    }

    let data: unknown;
    try {
      data = JSON.parse(rawBody) as unknown;
    } catch {
      throw new Error(`Invalid JSON response: ${rawBody.slice(0, 160)}`);
    }

    if (!isObj(data)) {
      throw new Error("API response is not an object");
    }
    alert(`API response: ${JSON.stringify(data)}`);
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