import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import LogoBlock from "@/components/shared/LogoBlock";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";

const GAMES = ["BGMI", "Valorant", "CSGO", "Free Fire", "PUBG PC", "Apex Legends"];
const ROLES = ["IGL", "Assaulter", "Filter", "Support"];

export default function AdminTeams() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [showPlayerForm, setShowPlayerForm] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({});
  const { toast } = useToast();
  const qc = useQueryClient();

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
      team.region,
      ...teamPlayers.map((player) => player.ign),
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
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      resetForm();
      toast({ title: "Team updated" });
    },
  });

  const deleteTeam = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Team deleted" });
    },
  });

  const createPlayer = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      resetPlayerForm();
      toast({ title: "Player added" });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      resetPlayerForm();
      toast({ title: "Player updated" });
    },
  });

  const deletePlayer = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Player removed" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
  };

  const resetPlayerForm = () => {
    setShowPlayerForm(null);
    setEditingPlayer(null);
    setPlayerForm({});
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
        team.id !== editing
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
          onClick={() => {
            setForm({});
            setEditing(null);
            setShowForm(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Team
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

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">{editing ? "Edit" : "Create"} Team</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tag *</Label>
              <Input value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. SouL" />
            </div>
            <div>
              <Label>Game</Label>
              <Select value={form.game || ""} onValueChange={(value) => setForm({ ...form, game: value })}>
                <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>{GAMES.map((game) => <SelectItem key={game} value={game}>{game}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region</Label>
              <Input value={form.region || ""} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Logo URL</Label>
              <Input value={form.logo_url || ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createTeam.isPending || updateTeam.isPending}>
              <Save className="w-4 h-4 mr-2" /> {editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredTeams.map((team) => {
          const teamPlayers = players.filter((player) => player.team_id === team.id);
          return (
            <div key={team.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {team.logo_url ? (
                    <LogoBlock
                      src={team.logo_url}
                      alt={team.name}
                      sizeClass="h-8 w-8"
                      roundedClass="rounded-lg"
                      paddingClass="p-1"
                    />
                  ) : (
                    <LogoBlock
                      sizeClass="h-8 w-8"
                      roundedClass="rounded-lg"
                      paddingClass="p-1"
                      className="bg-primary/10 border-primary/10"
                    >
                      <span className="text-xs font-bold text-primary">{team.tag?.slice(0, 2)}</span>
                    </LogoBlock>
                  )}
                  <div>
                    <span className="font-semibold text-sm">
                      {team.name} <span className="text-muted-foreground">({team.tag})</span>
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {team.game || "Multi"} / {team.region || "Global"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (showPlayerForm === team.id && !editingPlayer) {
                        resetPlayerForm();
                      } else {
                        setShowPlayerForm(team.id);
                        setEditingPlayer(null);
                        setPlayerForm({});
                      }
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setForm({ ...team });
                      setEditing(team.id);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteTeam.mutate(team.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {teamPlayers.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-11">
                  {teamPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 text-xs">
                      <span className="font-medium">{player.ign}</span>
                      <span className="text-muted-foreground">{player.role}</span>
                      <button
                        onClick={() => {
                          setShowPlayerForm(team.id);
                          setEditingPlayer(player.id);
                          setPlayerForm({ ign: player.ign || "", role: player.role || "" });
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deletePlayer.mutate(player.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showPlayerForm === team.id && (
                <div className="flex gap-2 ml-11 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">IGN</Label>
                    <Input
                      value={playerForm.ign || ""}
                      onChange={(e) => setPlayerForm({ ...playerForm, ign: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Role</Label>
                    <Select value={playerForm.role || ""} onValueChange={(value) => setPlayerForm({ ...playerForm, role: value })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={handleAddPlayer} className="h-8" disabled={createPlayer.isPending || updatePlayer.isPending}>
                    {editingPlayer ? "Update" : "Add"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetPlayerForm} className="h-8">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
