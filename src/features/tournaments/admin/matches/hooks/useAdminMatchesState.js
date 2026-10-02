import { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { confirmDiscardIfDirty, createFormSnapshot } from "@/components/admin/formState";
import { getStageConfig, getStageGroupOptions, getRotationGroupLabel, buildAutoSchedulePreview, buildMatchKey } from "@/features/tournaments/admin/matches/utils/matchEditorHelpers";

export function useAdminMatchesState() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const initialFormSnapshotRef = useRef(null);
  if (initialFormSnapshotRef.current === null) {
    initialFormSnapshotRef.current = createFormSnapshot({});
  }
  const [autoForm, setAutoForm] = useState({
    tournament_id: "",
    stage: "",
    day: "1",
    group_name: "",
    source: "rotation",
    custom_maps: "Erangel, Miramar, Miramar, Sanhok, Erangel, Miramar",
    start_time: "",
    interval_minutes: "45",
    starting_match_number: "",
    status: "scheduled",
    stream_url: "",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: matches = [], isLoading: matchesLoading, isError: matchesError, refetch: matchesRefetch } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 300),
  });
  const { data: tournaments = [], isLoading: tournamentsLoading, isError: tournamentsError, refetch: tournamentsRefetch } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });
  const { data: allMatchResults = [], isLoading: allMatchResultsLoading, isError: allMatchResultsError, refetch: allMatchResultsRefetch } = useQuery({
    queryKey: ["match-results-all"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 2000),
    staleTime: 60_000,
  });
  const availableTournaments = tournaments.filter(
    (tournament) => tournament.status !== "completed",
  );

  const tournamentMap = {};
  tournaments.forEach((tournament) => {
    tournamentMap[tournament.id] = tournament;
  });

  const createMatch = useMutation({
    mutationFn: (data) => base44.entities.Match.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      resetForm();
      toast({ title: "Match created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create match",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMatch = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Match.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      resetForm();
      toast({ title: "Match updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update match",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMatch = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Match deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete match",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.Match.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createMatchesBulk = useMutation({
    mutationFn: (records) => base44.entities.Match.bulkCreate(records),
    onSuccess: (_, records) => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({
        title: "Schedule created",
        description: `${records.length} matches added.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create matches",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isFormMutating =
    createMatch.isPending || updateMatch.isPending || deleteMatch.isPending;
  const isScheduleMutating =
    createMatchesBulk.isPending || updateStatus.isPending;

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
    initialFormSnapshotRef.current = createFormSnapshot({});
  };

  const isFormDirty = createFormSnapshot(form) !== initialFormSnapshotRef.current;

  const attemptCloseForm = () => {
    if (!confirmDiscardIfDirty(isFormDirty)) return;
    resetForm();
  };

  const openCreate = () => {
    if (showForm && !confirmDiscardIfDirty(isFormDirty)) return;
    setEditing(null);
    const nextForm = { status: "scheduled", stream_url: "" };
    setForm(nextForm);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const openEdit = (match) => {
    if (showForm && editing !== match.id && !confirmDiscardIfDirty(isFormDirty))
      return;
    setEditing(match.id);
    const nextForm = {
      ...match,
      scheduled_time: match.scheduled_time
        ? String(match.scheduled_time).slice(0, 16)
        : "",
    };
    setForm(nextForm);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const selectedTournament = availableTournaments.find(
    (tournament) => tournament.id === form.tournament_id,
  );
  const stages = selectedTournament?.stages?.map((stage) => stage.name) || [];
  const selectedStageConfig = getStageConfig(selectedTournament, form.stage);
  const stageGroupOptions = getStageGroupOptions(selectedStageConfig);
  const showGroupField = stageGroupOptions.length > 0;

  const autoTournament = availableTournaments.find(
    (tournament) => tournament.id === autoForm.tournament_id,
  );
  const autoStages = autoTournament?.stages?.map((stage) => stage.name) || [];
  const autoStageConfig = getStageConfig(autoTournament, autoForm.stage);
  const autoStageGroupOptions = getStageGroupOptions(autoStageConfig);
  const inferredRotationGroup =
    autoForm.source === "rotation"
      ? getRotationGroupLabel(autoStageConfig, Number(autoForm.day))
      : "";
  const autoSchedulePreview = useMemo(
    () => buildAutoSchedulePreview(autoForm, autoTournament, autoStageConfig),
    [autoForm, autoTournament, autoStageConfig],
  );
  const existingMatchKeys = useMemo(
    () => new Set(matches.map((match) => buildMatchKey(match))),
    [matches],
  );
  const matchIdsWithResults = useMemo(
    () =>
      allMatchResults.reduce((ids, result) => {
        if (result.match_id) {
          ids.add(result.match_id);
        }
        return ids;
      }, new Set()),
    [allMatchResults],
  );
  const staleScheduledMatchIds = useMemo(
    () =>
      matches.reduce((ids, match) => {
        if (
          match.status === "scheduled" &&
          matchIdsWithResults.has(match.id)
        ) {
          ids.push(match.id);
        }
        return ids;
      }, []),
    [matches, matchIdsWithResults],
  );
  const syncInFlightRef = useRef(false);
  const previewWithStatus = autoSchedulePreview.entries.map((entry) => ({
    ...entry,
    alreadyExists: existingMatchKeys.has(buildMatchKey(entry)),
  }));

  useEffect(() => {
    if (syncInFlightRef.current || staleScheduledMatchIds.length === 0) return;

    let cancelled = false;
    syncInFlightRef.current = true;

    const syncCompletedMatches = async () => {
      try {
        await Promise.all(
          staleScheduledMatchIds.map((matchId) =>
            base44.entities.Match.update(matchId, { status: "completed" }),
          ),
        );

        if (!cancelled) {
          await qc.invalidateQueries({ queryKey: ["matches"] });
        }
      } finally {
        syncInFlightRef.current = false;
      }
    };

    syncCompletedMatches();

    return () => {
      cancelled = true;
    };
  }, [qc, staleScheduledMatchIds]);

  const normalizedMatches = useMemo(
    () =>
      matches.map((match) =>
        match.status === "scheduled" && matchIdsWithResults.has(match.id)
          ? { ...match, status: "completed" }
          : match,
      ),
    [matches, matchIdsWithResults],
  );

  const handleSubmit = () => {
    if (!form.tournament_id || !form.stage) {
      toast({ title: "Tournament and stage required", variant: "destructive" });
      return;
    }

    if (showGroupField && !form.group_name) {
      toast({
        title: "Group is required for this stage",
        variant: "destructive",
      });
      return;
    }

    if (editing) {
      updateMatch.mutate({ id: editing, data: form });
    } else {
      createMatch.mutate(form);
    }
  };

  const handleGenerateSchedule = () => {
    if (autoSchedulePreview.error) {
      toast({ title: autoSchedulePreview.error, variant: "destructive" });
      return;
    }

    const freshEntries = previewWithStatus.reduce((items, entry) => {
      if (entry.alreadyExists) return items;
      const { alreadyExists, ...nextEntry } = entry;
      items.push(nextEntry);
      return items;
    }, []);

    if (!freshEntries.length) {
      toast({
        title: "Nothing to create",
        description:
          "All previewed matches already exist for that stage/day/group.",
      });
      return;
    }

    createMatchesBulk.mutate(freshEntries);
  };


  return {
    queryState: { isLoading: matchesLoading || tournamentsLoading || allMatchResultsLoading, isError: matchesError || tournamentsError || allMatchResultsError, refetch: () => Promise.all([matchesRefetch(), tournamentsRefetch(), allMatchResultsRefetch()]) },
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
    matches: normalizedMatches,
    tournamentMap,
    openCreate,
    stages,
    showGroupField,
    stageGroupOptions,
    handleSubmit,
    submitPending: createMatch.isPending || updateMatch.isPending,
    updateStatus,
    openEdit,
    deleteMatch,
  };
}
