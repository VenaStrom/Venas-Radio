
export function Link({ href, children }: { href: string; children: React.ReactNode; }): React.ReactNode {
  return (
    <button
      className=""
      onClick={() => {
        window.history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    >
      {children}
    </button>
  );
}