import React from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LogoBlock from "@/components/shared/LogoBlock";
import { createFormSnapshot } from "@/components/admin/formState";
import { ROLES } from "@/components/admin/teams/utils/teamEditorHelpers";

export function TeamRosterList({
  filteredTeams,
  players,
  ui,
  dispatch,
  handlers,
  mutations,
  snapshots,
}) {
  const { showForm, editing, showPlayerForm, editingPlayer, playerForm, isFormDirty } =
    ui;
  const { isTeamMutating, isPlayerMutating, deleteTeam, deletePlayer } =
    mutations;
  const {
    attemptClosePlayerForm,
    handleAddPlayer,
    confirmDiscardIfDirty,
  } = handlers;
  const { initialFormSnapshotRef, initialPlayerFormSnapshotRef } = snapshots;

  return (
    <div className="space-y-3">
      {filteredTeams.map((team) => {
        const teamPlayers = players.filter((player) => player.team_id === team.id);
        return (
          <div
            key={team.id}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {team.logo_url ? (
                  <LogoBlock
                    src={team.logo_url}
                    alt={team.name}
                    sizeClass="size-8"
                    roundedClass="rounded-lg"
                    paddingClass="p-1"
                  />
                ) : (
                  <LogoBlock
                    sizeClass="size-8"
                    roundedClass="rounded-lg"
                    paddingClass="p-1"
                    className="bg-primary/10 border-primary/10"
                  >
                    <span className="text-xs font-bold text-primary">
                      {team.tag?.slice(0, 2)}
                    </span>
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
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (showPlayerForm === team.id && !editingPlayer) {
                      attemptClosePlayerForm();
                    } else {
                      const nextPlayerForm = {};
                      dispatch({
                        type: "patch",
                        payload: {
                          showPlayerForm: team.id,
                          editingPlayer: null,
                          playerForm: nextPlayerForm,
                        },
                      });
                      initialPlayerFormSnapshotRef.current =
                        createFormSnapshot(nextPlayerForm);
                    }
                  }}
                  disabled={isPlayerMutating}
                >
                  <UserPlus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (
                      showForm &&
                      editing !== team.id &&
                      !confirmDiscardIfDirty(isFormDirty)
                    )
                      return;
                    const nextForm = { ...team };
                    dispatch({
                      type: "patch",
                      payload: {
                        form: nextForm,
                        editing: team.id,
                        showForm: true,
                      },
                    });
                    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
                  }}
                  disabled={isTeamMutating}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (window.confirm("Delete this team? All players will also be removed.")) deleteTeam.mutate(team.id); }}
                  disabled={isTeamMutating}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>

            {teamPlayers.length > 0 ? (
              <div className="flex flex-wrap gap-2 ml-11">
                {teamPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium">{player.ign}</span>
                    <span className="text-muted-foreground">{player.role}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextPlayerForm = {
                          ign: player.ign || "",
                          role: player.role || "",
                        };
                        dispatch({
                          type: "patch",
                          payload: {
                            showPlayerForm: team.id,
                            editingPlayer: player.id,
                            playerForm: nextPlayerForm,
                          },
                        });
                        initialPlayerFormSnapshotRef.current =
                          createFormSnapshot(nextPlayerForm);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={isPlayerMutating}
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (window.confirm("Remove this player?")) deletePlayer.mutate(player.id); }}
                      className="text-destructive hover:text-destructive/80"
                      disabled={isPlayerMutating}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {showPlayerForm === team.id ? (
              <div className="flex gap-2 ml-11 items-end">
                <div className="flex-1">
                  <Label className="text-xs">IGN</Label>
                  <Input
                    value={playerForm.ign || ""}
                    onChange={(e) =>
                      dispatch({
                        type: "patch",
                        payload: {
                          playerForm: {
                            ...playerForm,
                            ign: e.target.value,
                          },
                        },
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Role</Label>
                  <Select
                    value={playerForm.role || ""}
                    onValueChange={(value) =>
                      dispatch({
                        type: "patch",
                        payload: {
                          playerForm: { ...playerForm, role: value },
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPlayer}
                  className="h-8"
                  disabled={isPlayerMutating}
                >
                  {editingPlayer ? "Update" : "Add"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={attemptClosePlayerForm}
                  className="h-8"
                  disabled={isPlayerMutating}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
