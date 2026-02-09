import type { Program } from "@prisma/client";
import Image from "next/image";
import SRAttribute from "@/components/sr-attribute";
import LikeButton from "@/components/like-button";

export default function ProgramDOM({ program, }: { program: Program, }) {
  return (
    <li className="grid grid-cols-[82px_1fr] grid-rows-[min_82px_min_min] gap-y-2 gap-x-3">
      {/* SR Attribute */}
      <SRAttribute className="col-span-2" />

      {/* Thumbnail */}
      <Image
        width={82}
        height={82}
        className="bg-zinc-600 rounded-md"
        src={program.image_square_url}
        alt="Programbild"
        fetchPriority="low"
      />

      {/* Header Text */}
      <div className="col-start-2 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-x-2">
        {/* Program name */}
        <p className="col-start-1 text-base font-bold overflow-hidden">{program.name}</p>

        {/* Other info */}
        <p className="col-start-1 text-xs font-normal text-zinc-300 overflow-hidden">{program.broadcast_info}</p>

        {/* Like button */}
        <LikeButton programID={program.id} />
      </div>

      {/* Description */}
      <p className="col-span-2 text-xs pt-1 font-normal overflow-hidden">{program.description}</p>
    </li>
  );
}

function Skeleton() {
  return (
    <li className="grid grid-cols-[96px_1fr] grid-rows-[min_96px_min_min] gap-y-2">
      {/* SR Attribute */}
      <div className="col-span-2 h-5"></div>

      {/* Thumbnail */}
      <div className="bg-zinc-600 rounded-md size-20.5 animate-pulse"></div>

      {/* Header Text */}
      <div className="col-start-2 grid grid-cols-[1fr_auto] gap-x-1 gap-y-1 pt-2">
        {/* Program name */}
        <div className="bg-zinc-600 rounded-md col-start-1 h-5 animate-pulse"></div>

        {/* Other info */}
        {/* <div className="bg-zinc-600 rounded-md col-start-1 h-3 animate-pulse"></div> */}
      </div>

      {/* Description */}
      <div className="bg-zinc-600 rounded-md col-start-1 col-end-3 h-10 animate-pulse pt-1"></div>
      {/* <div className="col-span-2 h-10 text-s pt-1 font-normal overflow-hidden animate-pulse"></div> */}
    </li>
  );
};
ProgramDOM.Skeleton = Skeleton;