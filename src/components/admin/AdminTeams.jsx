import React, { useReducer, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { confirmDiscardIfDirty, createFormSnapshot } from "@/components/admin/formState";
import { adminTeamsReducer, ADMIN_TEAMS_INITIAL_STATE } from "@/components/admin/teams/utils/teamEditorHelpers";
import { TeamEditor } from "@/components/admin/teams/sections/TeamEditor";
import { TeamRosterList } from "@/components/admin/teams/sections/TeamRosterList";

export default function AdminTeams() {
  const [uiState, dispatch] = useReducer(
    adminTeamsReducer,
    ADMIN_TEAMS_INITIAL_STATE,
  );
  const initialFormSnapshotRef = useRef(null);
  if (initialFormSnapshotRef.current === null) {
    initialFormSnapshotRef.current = createFormSnapshot({});
  }
  const [search, setSearch] = useState("");
  const initialPlayerFormSnapshotRef = useRef(null);
  if (initialPlayerFormSnapshotRef.current === null) {
    initialPlayerFormSnapshotRef.current = createFormSnapshot({});
  }
  const { toast } = useToast();
  const qc = useQueryClient();
  const { showForm, editing, form, showPlayerForm, editingPlayer, playerForm } =
    uiState;

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 100),
  });
  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list("-created_date", 200),
  });

  const filteredTeams = teams.filter((team) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    const teamPlayers = players.filter((player) => player.team_id === team.id);
    return [
      team.name,
      team.tag,
      team.game,
      team.region, ...teamPlayers.map((player) => player.ign),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const createTeam = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      resetForm();
      toast({ title: "Team created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create team",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      resetForm();
      toast({ title: "Team updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update team",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTeam = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Team deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete team",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPlayer = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      resetPlayerForm();
      toast({ title: "Player added" });
    },
    onError: (error) => {
      toast({
        title: "Failed to add player",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      resetPlayerForm();
      toast({ title: "Player updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update player",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePlayer = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Player removed" });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove player",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isTeamMutating =
    createTeam.isPending || updateTeam.isPending || deleteTeam.isPending;
  const isPlayerMutating =
    createPlayer.isPending || updatePlayer.isPending || deletePlayer.isPending;

  const resetForm = () => {
    dispatch({ type: "resetTeamForm" });
    initialFormSnapshotRef.current = createFormSnapshot({});
  };

  const resetPlayerForm = () => {
    dispatch({ type: "resetPlayerForm" });
    initialPlayerFormSnapshotRef.current = createFormSnapshot({});
  };

  const isFormDirty = createFormSnapshot(form) !== initialFormSnapshotRef.current;
  const isPlayerFormDirty =
    createFormSnapshot(playerForm) !== initialPlayerFormSnapshotRef.current;

  const attemptCloseForm = () => {
    if (!confirmDiscardIfDirty(isFormDirty)) return;
    resetForm();
  };

  const attemptClosePlayerForm = () => {
    if (!confirmDiscardIfDirty(isPlayerFormDirty)) return;
    resetPlayerForm();
  };

  const handleSubmit = () => {
    if (!form.name || !form.tag) {
      toast({ title: "Name and tag are required", variant: "destructive" });
      return;
    }

    const targetKey = normalizeOrganizationName(form.name);
    const conflictingTeam = teams.find(
      (team) =>
        normalizeOrganizationName(team.name) === targetKey &&
        team.id !== editing,
    );

    if (conflictingTeam) {
      toast({
        title: `Team already exists as ${conflictingTeam.name}`,
        variant: "destructive",
      });
      return;
    }

    if (editing) {
      updateTeam.mutate({ id: editing, data: form });
    } else {
      createTeam.mutate(form);
    }
  };

  const handleAddPlayer = () => {
    if (!playerForm.ign) {
      toast({ title: "IGN is required", variant: "destructive" });
      return;
    }

    const payload = { ...playerForm, team_id: showPlayerForm };
    if (editingPlayer) {
      updatePlayer.mutate({ id: editingPlayer, data: payload });
    } else {
      createPlayer.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Teams ({teams.length})</h2>
        <Button
          type="button"
          onClick={() => {
            if (showForm && !confirmDiscardIfDirty(isFormDirty)) return;
            const nextForm = {};
            dispatch({
              type: "patch",
              payload: { form: nextForm, editing: null, showForm: true },
            });
            initialFormSnapshotRef.current = createFormSnapshot(nextForm);
          }}
          size="sm"
          className="gap-2"
          disabled={isTeamMutating}
        >
          <Plus className="size-4" /> New Team
        </Button>
      </div>

      <div className="max-w-sm">
        <Label>Search Teams</Label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team, player, tag, or region"
        />
      </div>

      <TeamEditor
        showForm={showForm}
        editing={editing}
        form={form}
        dispatch={dispatch}
        isTeamMutating={isTeamMutating}
        attemptCloseForm={attemptCloseForm}
        handleSubmit={handleSubmit}
        createTeam={createTeam}
        updateTeam={updateTeam}
      />
      <TeamRosterList
        filteredTeams={filteredTeams}
        players={players}
        ui={{ showForm, editing, showPlayerForm, editingPlayer, playerForm, isFormDirty }}
        dispatch={dispatch}
        handlers={{ attemptClosePlayerForm, handleAddPlayer, confirmDiscardIfDirty }}
        mutations={{ isTeamMutating, isPlayerMutating, deleteTeam, deletePlayer }}
        snapshots={{ initialFormSnapshotRef, initialPlayerFormSnapshotRef }}
      />
    </div>
  );
}
