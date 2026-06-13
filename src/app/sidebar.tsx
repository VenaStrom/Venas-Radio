import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { LoginButton } from "@/components/login-button";

export function Sidebar() {
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH ?? "";
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT ?? "";
  const shortCommit = commit ? commit.slice(0, 7) : "";
  const repoUrl = "https://github.com/VenaStrom/Venas-Radio";

  return (
    <Sheet modal={false}>
      <SheetTrigger>
        <MenuIcon size={48} />
      </SheetTrigger>

      <SheetContent
        className="bg-zinc-950 border-zinc-700"
        aria-description="Inställningar för Venas Radio, inklusive inloggning och synkronisering av favoriter."
      >
        <SheetDescription className="hidden" aria-hidden="false">
          Här kan du logga in för att spara dina favoriter och inställningar, så att de synkroniseras mellan enheter.
        </SheetDescription>

        <div className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Inställningar</SheetTitle>

            <small>
              Spara dina favoriter och inställningar för att synka mellan enheter.
            </small>
            <LoginButton />

            <SheetClose />
          </SheetHeader>

          <div className="mt-auto pt-6 text-xs text-zinc-400">
            <div className="flex flex-col gap-1">
              {branch ? (
                <a
                  className="hover:text-zinc-200"
                  href={`${repoUrl}/tree/${branch}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Branch: {branch}
                </a>
              ) : (
                <span>Branch: okänd</span>
              )}

              {commit ? (
                <a
                  className="hover:text-zinc-200"
                  href={`${repoUrl}/commit/${commit}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Commit: {shortCommit}
                </a>
              ) : (
                <span>Commit: okänd</span>
              )}
            </div>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}