"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettingsStore } from "@/store/settings-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function SettingsMenu() {
  const { settings, setAllSettings } = useSettingsStore();
  const [uncommittedSettings, setUncommittedSettings] = useState({ ...settings, programIDsString: settings.programIDs.join(", ") });

  return (
    <Dialog onOpenChange={(isOpen) => {
      // Save on close
      if (isOpen) {
        setUncommittedSettings({ ...settings, programIDsString: settings.programIDs.join(", ") });
      }
      else if (!isOpen) {
        setAllSettings({ ...uncommittedSettings, programIDs: uncommittedSettings.programIDsString.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id)) });
      }
    }}>
      <DialogTrigger>
        <SettingsIcon />
      </DialogTrigger>

      <DialogContent className="w-[90%] bg-zinc-900 rounded-lg border-none">
        <DialogHeader>
          <DialogTitle>
            Inställningar
          </DialogTitle>
          <DialogDescription>

          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-6">
          {/* Compact view */}
          <Label className="leading-4 flex flex-row gap-x-2 items-center">
            <Input className="h-5 w-fit" type="checkbox" autoFocus={false}
              checked={uncommittedSettings.compactView}
              onChange={(e) => setUncommittedSettings({ ...uncommittedSettings, compactView: e.target.checked })}
            />
            Kompakt vy.
          </Label>

          {/* Back day */}
          <Label>
            Antal dagar tillbaka program ska hämtas ifrån.
            <Input className="mt-1" placeholder="Antal dagar ex. 7" type="number" autoFocus={false}
              value={uncommittedSettings.fetchBack || ""}
              onChange={(e) => setUncommittedSettings({ ...uncommittedSettings, fetchBack: Math.max(0, parseInt(e.target.value)) })}
            />
          </Label>

          {/* Followed programs */}
          {/* <Label className="leading-4">
            Program att hämta. <span className="text-zinc-400">OBS! Detta är inte den slutgiltiga lösningen för den här funktionen.</span>
            <Input className="mt-1" placeholder="Program ID ex. 4923, 178" type="text" autoFocus={false}
              value={uncommittedSettings.programIDsString || ""}
              onChange={(e) => setUncommittedSettings({ ...uncommittedSettings, programIDsString: e.target.value })}
            />
          </Label> */}
        </div>

        <DialogFooter>
          <Button className="bg-zinc-950 text-zinc-100 mt-1 text-base p-5 font-semibold" autoFocus={true}
            onClick={(e) => {
              setAllSettings(uncommittedSettings);
              (e.target as HTMLButtonElement).textContent = "Sparat";
            }}
            onBlur={(e) => (e.target as HTMLButtonElement).textContent = "Spara"}
          >
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}