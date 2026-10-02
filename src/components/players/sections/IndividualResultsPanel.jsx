import React from "react";
import ProfilePanel from "@/components/shared/ProfilePanel";
import ResultsByYearTable from "@/components/shared/ResultsByYearTable";

export function IndividualResultsPanel({ resultYears, playerResults }) {
  return (
    <ProfilePanel title="Individual results">
      {playerResults.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No S/A/B-Tier result rows have been mapped for this player yet.
        </p>
      ) : (
        <ResultsByYearTable
          buckets={resultYears}
          title="Results by Year"
          wrapperClassName="mt-6 space-y-5 border-t border-border pt-5"
          headingClassName="text-[11px] font-bold uppercase tracking-[0.24em] text-primary"
          yearClassName="text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
          tableClassName="w-full min-w-[760px] text-sm"
          headerRowClassName="border-b border-border text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          cellClassName="p-3"
          bodyRowClassName="border-b border-border/70 last:border-b-0"
        />
      )}
    </ProfilePanel>
  );
}
