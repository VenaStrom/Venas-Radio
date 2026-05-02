import { useState } from "react";

export function LivePage(): React.ReactNode {
  const [page, _setPage] = useState<number>(1);
  const pageSize = 20;
  const data = fetch(`/api/channels?page=${page}&pagesize=${pageSize}`).then(res => res.json());

  return (
    <main>
      LIVE

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}