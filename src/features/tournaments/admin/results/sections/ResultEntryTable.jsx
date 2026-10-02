import { Table } from "@/components/ui/table";
import React from "react";
import { Input } from "@/components/ui/input";

export function ResultEntryTable({ entries, onEntryChange }) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/20">
            <th className="text-left p-3">Team</th>
            <th className="text-center p-3 w-24">Placement</th>
            <th className="text-center p-3 w-24">Kills</th>
            <th className="text-center p-3 w-20">Place Pts</th>
            <th className="text-center p-3 w-20">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry, idx) => (
            <tr key={entry.team_id}>
              <td className="p-3 font-medium">{entry.team_name}</td>
              <td className="p-3">
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={entry.placement > 0 ? entry.placement : ""}
                  onChange={(e) => onEntryChange(idx, "placement", e.target.value)}
                  className="h-8 text-center"
                />
              </td>
              <td className="p-3"><Input type="number" min={0} value={entry.kill_points ?? 0} onChange={(e) => onEntryChange(idx, "kill_points", e.target.value)} className="h-8 text-center" /></td>
              <td className="p-3 text-center text-muted-foreground">{entry.placement_points}</td>
              <td className="p-3 text-center font-bold text-primary">{entry.total_points}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
