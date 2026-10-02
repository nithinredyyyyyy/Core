import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareMenu from "@/components/shared/ShareMenu";

export function BackButton({ onBack, tournamentName }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 size-4" /> Back to Tournaments
      </Button>
      {tournamentName ? <ShareMenu title={tournamentName} /> : null}
    </div>
  );
}
