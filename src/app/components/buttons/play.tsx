
export function PlayButton({ playId, className = "" }: { playId: number, className?: string }): React.ReactNode {

  return (
    <button className={` ${className}`} id={`play-btn-${playId}`}>
      P
    </button>
  );
}