import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { confirmDiscardIfDirty, createFormSnapshot } from "@/components/admin/formState";
import { EMPTY_FORM, DEFAULT_STAGES, serializeRows, serializeParticipants, normalizeStages, parseRows, normalizeParticipantRows } from "@/features/tournaments/admin/utils/tournamentEditorHelpers";

export function useAdminTournamentsState() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const initialFormSnapshotRef = useRef(null);
  if (initialFormSnapshotRef.current === null) {
    initialFormSnapshotRef.current = createFormSnapshot({
      ...EMPTY_FORM,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
    });
  }
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tournaments = [], isLoading: tournamentsLoading, isError: tournamentsError, refetch: tournamentsRefetch } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: () =>
      base44.entities.Tournament.list("-created_date", 50, undefined, {
        fields:
          "id,name,game,tier,status,prize_pool,start_date,end_date,max_teams,banner_url,created_date,updated_date,description,format_overview,stages",
      }),
    staleTime: 60_000,
  });
  const visibleTournaments = tournaments.filter((tournament) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active"
        ? tournament.status !== "completed"
        : tournament.status === statusFilter);
    if (!matchesStatus) return false;

    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const searchable = [
      tournament.name,
      tournament.game,
      tournament.status,
      tournament.prize_pool,
      tournament.description,
      tournament.format_overview,
      ...(tournament.stages || []).map((stage) => stage.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
  const { data: teams = [], isLoading: teamsLoading, isError: teamsError, refetch: teamsRefetch } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 500),
    enabled: showForm,
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Tournament.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      resetForm();
      toast({ title: "Tournament created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create tournament",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tournament.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      resetForm();
      toast({ title: "Tournament updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tournament",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Tournament.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Tournament deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete tournament",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isMutating =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const resetForm = () => {
    const nextForm = {
      ...EMPTY_FORM,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
    };
    setShowForm(false);
    setEditing(null);
    setForm(nextForm);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
  };

  const isFormDirty = createFormSnapshot(form) !== initialFormSnapshotRef.current;

  const attemptCloseForm = () => {
    if (!confirmDiscardIfDirty(isFormDirty)) return;
    resetForm();
  };

  const openCreate = () => {
    if (showForm && !confirmDiscardIfDirty(isFormDirty)) return;
    const nextForm = {
      ...EMPTY_FORM,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
    };
    setForm(nextForm);
    setEditing(null);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const openEdit = async (t) => {
    if (showForm && editing !== t.id && !confirmDiscardIfDirty(isFormDirty))
      return;
    let fullTournament = t;
    try {
      fullTournament = await base44.entities.Tournament.get(t.id);
    } catch (error) {
      toast({
        title: "Could not load tournament",
        description: error?.message || "Try opening it again.",
        variant: "destructive",
      });
      return;
    }
    const nextForm = {
      ...EMPTY_FORM,
      ...fullTournament,
      stages: (fullTournament.stages || DEFAULT_STAGES).map((stage, index) => ({
        ...stage,
        order: stage.order || index + 1,
        teamCount: stage.teamCount ?? "",
        summary: stage.summary || "",
        mapRotationText: serializeRows(stage.mapRotation || [], [
          "match",
          "map",
          "day1",
          "day2",
          "day3",
          "day4Map",
          "day4",
        ]),
      })),
      calendarText: serializeRows(fullTournament.calendar, ["week", "label"]),
      prizeBreakdownText: serializeRows(fullTournament.prize_breakdown, [
        "placement",
        "team",
        "inr",
        "usd",
        "stage",
      ]),
      awardsText: serializeRows(fullTournament.awards, [
        "title",
        "player",
        "team",
        "country",
        "inr",
        "usd",
      ]),
      participantsRows: serializeParticipants(fullTournament.participants),
      rankingsText: JSON.stringify(fullTournament.rankings || [], null, 2),
    };
    setForm(nextForm);
    setEditing(t.id);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.game) {
      toast({ title: "Name and game are required", variant: "destructive" });
      return;
    }
    let rankings = [];
    try {
      rankings = form.rankingsText?.trim() ? JSON.parse(form.rankingsText) : [];
    } catch {
      toast({ title: "Rankings JSON is invalid", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      stages: normalizeStages(form.stages),
      calendar: parseRows(form.calendarText || "", ["week", "label"]),
      prize_breakdown: parseRows(form.prizeBreakdownText || "", [
        "placement",
        "team",
        "inr",
        "usd",
        "stage",
      ]),
      awards: parseRows(form.awardsText || "", [
        "title",
        "player",
        "team",
        "country",
        "inr",
        "usd",
      ]),
      participants: normalizeParticipantRows(form.participantsRows || []),
      rankings,
    };

    delete payload.calendarText;
    delete payload.prizeBreakdownText;
    delete payload.awardsText;
    delete payload.participantsRows;
    delete payload.rankingsText;

    if (editing) {
      updateMut.mutate({ id: editing, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const addStage = () => {
    setForm((prev) => ({
      ...prev,
      stages: [
        ...(prev.stages || []),
        {
          name: "",
          order: (prev.stages || []).length + 1,
          status: "upcoming",
          teamCount: "",
          summary: "",
          mapRotationText: "",
        },
      ],
    }));
  };

  const removeStage = (idx) => {
    setForm((prev) => {
      const stages = [...(prev.stages || [])];
      stages.splice(idx, 1);
      return { ...prev, stages };
    });
  };

  const updateStage = (idx, field, value) => {
    setForm((prev) => {
      const stages = [...(prev.stages || [])];
      stages[idx] = { ...stages[idx], [field]: value };
      return { ...prev, stages };
    });
  };

  const addParticipant = () => {
    setForm((prev) => {
      const rows = prev.participantsRows || [];
      return {
        ...prev,
        participantsRows: [
          ...rows,
          {
            placement: rows.length + 1,
            team: "",
            stage: "",
            group_name: "",
            playersText: "",
          },
        ],
      };
    });
  };

  const updateParticipant = (idx, field, value) => {
    setForm((prev) => {
      const rows = [...(prev.participantsRows || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, participantsRows: rows };
    });
  };

  const removeParticipant = (idx) => {
    setForm((prev) => {
      const rows = [...(prev.participantsRows || [])];
      rows.splice(idx, 1);
      return { ...prev, participantsRows: rows };
    });
  };


  return {
    queryState: { isLoading: tournamentsLoading || teamsLoading, isError: tournamentsError || teamsError, refetch: () => Promise.all([tournamentsRefetch(), teamsRefetch()]) },
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
  };
}
