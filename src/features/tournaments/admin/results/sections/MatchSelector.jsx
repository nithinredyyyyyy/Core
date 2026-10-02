import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MatchSelector({ selectedMatch, onSelectMatch, availableMatches, tournamentMap }) {
  return (
    <div>
      <Label>Select Match</Label>
      <Select value={selectedMatch} onValueChange={onSelectMatch}>
        <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose a match" /></SelectTrigger>
        <SelectContent>
          {availableMatches.map((match) => (
            <SelectItem key={match.id} value={match.id}>
              {tournamentMap[match.tournament_id]?.name || "?"} - {match.stage}{match.group_name ? ` (${match.group_name})` : ""} - Match #{match.match_number || "?"} {match.map ? `(${match.map})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
