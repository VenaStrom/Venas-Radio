import * as Icon from "lucide-react";
import ProgressBar from "./progress-bar";

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls() {
    return (<>
        {/* Progress bar */}
        <ProgressBar progress={50} />

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