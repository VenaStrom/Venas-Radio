import { FeedPage, LivePage, NotFound, SearchPage } from "@/app/views";
import { useState } from "react";

export function Router({ route }: { route: string; }): React.ReactNode {
  const [page, setPage] = useState<React.ReactNode>(routeSwitch(route));

  window.addEventListener("popstate", () => {
    setPage(routeSwitch(window.location.pathname));
  });

  return page;
}

function routeSwitch(route: string): React.ReactNode {
  switch (route) {
    case "":
    case "/":
      return <LivePage />;
    case "/search":
      return <SearchPage />;
    case "/feed":
      return <FeedPage />;
    default:
      return <NotFound />;
  }
}