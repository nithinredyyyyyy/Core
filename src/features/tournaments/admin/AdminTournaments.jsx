import PageSkeleton from "@/components/shared/PageSkeleton";
import QueryError from "@/components/shared/QueryError";
import PageShell from "@/components/shared/PageShell";
import React from "react";
import { useAdminTournamentsState } from "@/features/tournaments/admin/hooks/useAdminTournamentsState";
import { TournamentAdminHero } from "@/features/tournaments/admin/sections/TournamentAdminHero";
import { TournamentFormSection } from "@/features/tournaments/admin/sections/TournamentFormSection";
import { TournamentList } from "@/features/tournaments/admin/sections/TournamentList";

export default function AdminTournaments() {
  const {
    queryState,
    showForm,
    editing,
    form,
    teams,
    isMutating,
    setForm,
    attemptCloseForm,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addStage,
    updateStage,
    removeStage,
    handleSubmit,
    tournaments,
    visibleTournaments,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    openCreate,
    openEdit,
    deleteMut,
  } = useAdminTournamentsState();

  if (queryState.isError) return <QueryError onRetry={queryState.refetch} />;
  if (queryState.isLoading) return <PageSkeleton label="Loading editor" />;

  return (
    <PageShell>
      <TournamentAdminHero
        filteredCount={visibleTournaments.length}
        isMutating={isMutating}
        openCreate={openCreate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        tournaments={tournaments}
      />

      <TournamentFormSection
        showForm={showForm}
        editing={editing}
        form={form}
        teams={teams}
        isMutating={isMutating}
        setForm={setForm}
        attemptCloseForm={attemptCloseForm}
        addParticipant={addParticipant}
        updateParticipant={updateParticipant}
        removeParticipant={removeParticipant}
        addStage={addStage}
        updateStage={updateStage}
        removeStage={removeStage}
        handleSubmit={handleSubmit}
      />
      <TournamentList
        visibleTournaments={visibleTournaments}
        isMutating={isMutating}
        openEdit={openEdit}
        deleteTournament={(id) => deleteMut.mutate(id)}
      />
    </PageShell>
  );
}
