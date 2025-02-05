/**
 * A progress bar component
 * @param progress - The progress of the bar, in percent. e.g. 15, not 0.15"
 * @param className - Additional classes to apply to the outer container
 * @param innerClassName - Additional classes to apply to the inner bar
 * @returns A progress bar component
 * @example <ProgressBar progress={51} className="col-span-2 rounded-sm" />
 */
export default function ProgressBar({ progress, className, innerClassName }: { progress: number | string, className?: string, innerClassName?: string }) {
    return (
        <div className={`h-1 w-full bg-zinc-800 flex flex-col justify-start items-start ${className}`}>
            <div className={`h-full bg-zinc-100 rounded-e-sm ${innerClassName}`} style={{width: progress + "%"}}></div>
        </div>
    )
}