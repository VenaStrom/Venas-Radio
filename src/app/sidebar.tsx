import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { LoginButton } from "@/components/login-button";

export function Sidebar() {
  return (
    <Sheet>
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

        <SheetHeader>
          <SheetTitle>Inställningar</SheetTitle>

          <small>
            Spara dina favoriter och inställningar för att synka mellan enheter.
          </small>
          <LoginButton />

          <SheetClose />
        </SheetHeader>

      </SheetContent>
    </Sheet>
  );
}