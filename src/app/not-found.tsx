import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as Icons from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center h-screen *:z-20">

      <div className="flex flex-col items-center justify-center mb-20 *:z-20">
        {/* 404 */}
        <h1 className="absolute text-center text-7xl">404</h1>

        {/* Background Icon */}
        <Icons.AudioLines className="absolute !z-10" size={280} color="var(--color-zinc-800)" />
      </div>

      {/* Info */}
      <p className="text-center text-lg">Sidan hittades tyvärr inte.</p>

      {/* Back button */}
      <Link href="/" className="mt-4">
        <Button variant={"outline"} className="text-md">
          Till start
        </Button>
      </Link>
    </main>
  );
}