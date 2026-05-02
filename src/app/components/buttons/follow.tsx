
export function FollowButton({ playId, className = "" }: { playId: number, className?: string }): React.ReactNode {

  return (
    <button className={` ${className}`} id={`follow-btn-${playId}`}>
      F
    </button>
  );
}