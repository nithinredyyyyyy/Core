import PageSkeleton from "@/components/shared/PageSkeleton";
import QueryError from "@/components/shared/QueryError";
import PageShell from "@/components/shared/PageShell";
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminMatchesState } from "@/features/tournaments/admin/matches/hooks/useAdminMatchesState";
import { MatchAutoToolsSection } from "@/features/tournaments/admin/matches/sections/MatchAutoToolsSection";
import { MatchFormSection } from "@/features/tournaments/admin/matches/sections/MatchFormSection";
import { MatchListSection } from "@/features/tournaments/admin/matches/sections/MatchListSection";

export default function AdminMatches() {
  const {
    queryState,
    showForm,
    editing,
    form,
    setForm,
    attemptCloseForm,
    isFormMutating,
    isScheduleMutating,
    availableTournaments,
    autoForm,
    setAutoForm,
    autoStages,
    autoStageGroupOptions,
    inferredRotationGroup,
    autoSchedulePreview,
    previewWithStatus,
    createMatchesBulk,
    handleGenerateSchedule,
    matches,
    tournamentMap,
    openCreate,
    stages,
    showGroupField,
    stageGroupOptions,
    handleSubmit,
    submitPending,
    updateStatus,
    openEdit,
    deleteMatch,
  } = useAdminMatchesState();

  if (queryState.isError) return <QueryError onRetry={queryState.refetch} />;
  if (queryState.isLoading) return <PageSkeleton label="Loading editor" />;

  return (
    <PageShell>
      <MatchAutoToolsSection
        autoForm={autoForm}
        setAutoForm={setAutoForm}
        availableTournaments={availableTournaments}
        autoStages={autoStages}
        autoStageGroupOptions={autoStageGroupOptions}
        inferredRotationGroup={inferredRotationGroup}
        autoSchedulePreview={autoSchedulePreview}
        previewWithStatus={previewWithStatus}
        createMatchesBulk={createMatchesBulk}
        handleGenerateSchedule={handleGenerateSchedule}
      />

      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Matches ({matches.length})</h2>
        <Button
          type="button"
          onClick={openCreate}
          size="sm"
          className="gap-2"
          disabled={isFormMutating || isScheduleMutating}
        >
          <Plus className="size-4" /> New Match
        </Button>
      </div>

      <MatchFormSection
        showForm={showForm}
        editing={editing}
        form={form}
        setForm={setForm}
        attemptCloseForm={attemptCloseForm}
        isFormMutating={isFormMutating}
        availableTournaments={availableTournaments}
        stages={stages}
        showGroupField={showGroupField}
        stageGroupOptions={stageGroupOptions}
        handleSubmit={handleSubmit}
        submitPending={submitPending}
      />
      <MatchListSection
        matches={matches}
        tournamentMap={tournamentMap}
        updateStatus={updateStatus}
        isScheduleMutating={isScheduleMutating}
        openEdit={openEdit}
        isFormMutating={isFormMutating}
        deleteMatch={deleteMatch}
      />
    </PageShell>
  );
}
