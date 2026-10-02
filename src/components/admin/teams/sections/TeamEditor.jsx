import React from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAMES } from "@/components/admin/teams/utils/teamEditorHelpers";

export function TeamEditor({
  showForm,
  editing,
  form,
  dispatch,
  isTeamMutating,
  attemptCloseForm,
  handleSubmit,
  createTeam,
  updateTeam,
}) {
  if (!showForm) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">{editing ? "Edit" : "Create"} Team</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={attemptCloseForm}
          disabled={isTeamMutating}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Name *</Label>
          <Input
            value={form.name || ""}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, name: e.target.value } },
              })
            }
          />
        </div>
        <div>
          <Label>Tag *</Label>
          <Input
            value={form.tag || ""}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, tag: e.target.value } },
              })
            }
            placeholder="e.g. SouL"
          />
        </div>
        <div>
          <Label>Game</Label>
          <Select
            value={form.game || ""}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, game: value } },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent>
              {GAMES.map((game) => (
                <SelectItem key={game} value={game}>
                  {game}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Region</Label>
          <Input
            value={form.region || ""}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, region: e.target.value } },
              })
            }
          />
        </div>
        <div className="md:col-span-2">
          <Label>Logo URL</Label>
          <Input
            value={form.logo_url || ""}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, logo_url: e.target.value } },
              })
            }
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={attemptCloseForm}
          disabled={isTeamMutating}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={createTeam.isPending || updateTeam.isPending}
        >
          <Save className="size-4 mr-2" /> {editing ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}
