/**
 * A progress bar component
 * @param progress - The progress of the bar, in percentage. Defined by w-[${progress}%]"
 */
export default function ProgressBar({ progress }: { progress: number | string }) {
    return (
        <div className="h-1 w-full bg-zinc-800 flex flex-col justify-start items-start">
            <div className={`h-full bg-zinc-100 w-[${progress}%] rounded-e-sm`}></div>
        </div>
    )
}