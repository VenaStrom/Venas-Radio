import Image from "next/image";

/** 
* A small attribution to Sveriges Radio, the Swedish national radio.
*/
export default function SRAttribute({ className }: { className: string }) {
    return (
        <div className={`flex flex-row items-center gap-x-1 w-max h-min font-light text-xs text-zinc-400 ${className}`}>
            <p>Hämtat från Sveriges Radio</p>
            <Image className="rounded-sm" height={18} width={18} src={"/icons/sveriges-radio.jpg"} alt="SR"></Image>
        </div>
    )
}