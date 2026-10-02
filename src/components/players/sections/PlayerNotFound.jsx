import React from "react";
import { UserCircle2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export function PlayerNotFound() {
  return (
    <EmptyState
      icon={UserCircle2}
      title="Player not found"
      description="This player profile is not available in the current tournament and roster data."
    />
  );
}
