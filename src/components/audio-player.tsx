import * as Icon from "lucide-react";

export default function AudioControls() {
    return (<>
        {/* Progress bar */}
        <div id="progress-bar" className="h-1 w-full bg-zinc-800 flex flex-col justify-start items-start">
            <div id="progress-bar-fill" className="h-full bg-zinc-100 w-[50%] rounded-e-sm"></div>
        </div>

        {/* Controls */}
        <div id="player" className="flex flex-col items-center w-full px-5">

            {/*
            <button>
                <Icon.SkipBack size={30} />
            </button>
            */}

            <button className="self-end">
                <Icon.Play size={30} className="fill-zinc-100" />
                {/* <Icon.Pause size={30} /> */}
            </button>

            {/*
            <button>
                <Icon.SkipForward size={30} />
            </button>
            */}
        </div>
    </>)
}