import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { confirmDiscardIfDirty, createFormSnapshot } from "./formState";

const EMPTY_FORM = {
  window: "",
  date: "",
  country: "India",
  playersText: "",
  oldTeam: "",
  newTeam: "",
};

function TransferEntryForm({
  showForm,
  editing,
  form,
  setForm,
  teams,
  isMutating,
  attemptCloseForm,
  handleSubmit,
  createMut,
  updateMut,
}) {
  if (!showForm) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {editing ? "Edit" : "Create"} Transfer Entry
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={attemptCloseForm}
          disabled={isMutating}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Window *</Label>
          <Input
            value={form.window}
            onChange={(e) => setForm((prev) => ({ ...prev, window: e.target.value }))}
            placeholder="April 2026 Transfer Window"
          />
        </div>
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div>
          <Label>Country</Label>
          <Input
            value={form.country}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, country: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Players *</Label>
          <Input
            value={form.playersText}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, playersText: e.target.value }))
            }
            placeholder="Player1, Player2"
          />
        </div>
        <div>
          <Label>Old Team</Label>
          <Select
            value={form.oldTeam || "__none__"}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                oldTeam: value === "__none__" ? "" : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Leave blank for incoming/free agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No old team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>New Team</Label>
          <Select
            value={form.newTeam || "__none__"}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                newTeam: value === "__none__" ? "" : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Leave blank for outgoing/released" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No new team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={attemptCloseForm}
          disabled={isMutating}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={createMut.isPending || updateMut.isPending}
        >
          <Save className="mr-2 size-4" /> {editing ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

function TransferWindowList({ groupedWindows, isMutating, openEdit, deleteMut }) {
  return (
    <div className="space-y-3">
      {groupedWindows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No transfer-window entries yet.
        </div>
      ) : (
        groupedWindows.map(([windowName, entries]) => (
          <div key={windowName} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{windowName}</h3>
                <p className="text-xs text-muted-foreground">{entries.length} moves</p>
              </div>
            </div>

            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {entry.oldTeam || "Free Agent / Unattached"} {" -> "}{" "}
                      {entry.newTeam || "No Team / Released"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(entry.players || []).join(", ")}
                      {entry.date ? ` · ${entry.date}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(entry)}
                      disabled={isMutating}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMut.mutate(entry.id)}
                      disabled={isMutating}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminTransfers() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const initialFormSnapshotRef = useRef(createFormSnapshot(EMPTY_FORM));
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfer-windows"],
    queryFn: () => base44.entities.TransferWindow.list("-date", 500),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 500),
  });

  const groupedWindows = useMemo(
    () =>
      Array.from(
        transfers
          .reduce((map, entry) => {
            const current = map.get(entry.window) || [];
            current.push(entry);
            map.set(entry.window, current);
            return map;
          }, new Map())
          .entries(),
      ),
    [transfers],
  );

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    initialFormSnapshotRef.current = createFormSnapshot(EMPTY_FORM);
  };

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.TransferWindow.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfer-windows"] });
      resetForm();
      toast({ title: "Transfer entry created" });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransferWindow.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfer-windows"] });
      resetForm();
      toast({ title: "Transfer entry updated" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.TransferWindow.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfer-windows"] });
      toast({ title: "Transfer entry deleted" });
    },
  });

  const isMutating =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const isFormDirty = createFormSnapshot(form) !== initialFormSnapshotRef.current;

  const attemptCloseForm = () => {
    if (!confirmDiscardIfDirty(isFormDirty)) return;
    resetForm();
  };

  const openCreate = () => {
    if (showForm && !confirmDiscardIfDirty(isFormDirty)) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    initialFormSnapshotRef.current = createFormSnapshot(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (entry) => {
    if (showForm && editing !== entry.id && !confirmDiscardIfDirty(isFormDirty)) {
      return;
    }
    const nextForm = {
      window: entry.window || "",
      date: entry.date || "",
      country: entry.country || "India",
      playersText: Array.isArray(entry.players) ? entry.players.join(", ") : "",
      oldTeam: entry.oldTeam || "",
      newTeam: entry.newTeam || "",
    };
    setEditing(entry.id);
    setForm(nextForm);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.window.trim()) {
      toast({ title: "Window name is required", variant: "destructive" });
      return;
    }

    const payload = {
      window: form.window.trim(),
      date: form.date || null,
      country: form.country.trim() || "India",
      players: form.playersText.split(",").flatMap((player) => {
        const normalized = player.trim();
        return normalized ? [normalized] : [];
      }),
      oldTeam: form.oldTeam.trim() || null,
      newTeam: form.newTeam.trim() || null,
    };

    if (payload.players.length === 0) {
      toast({ title: "Add at least one player", variant: "destructive" });
      return;
    }

    if (!payload.oldTeam && !payload.newTeam) {
      toast({
        title: "Provide an old team, a new team, or both",
        variant: "destructive",
      });
      return;
    }

    if (editing) {
      updateMut.mutate({ id: editing, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Transfer Windows ({transfers.length})</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming and outgoing roster moves.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <Plus className="size-4" /> New Transfer
        </Button>
      </div>

      <TransferEntryForm
        showForm={showForm}
        editing={editing}
        form={form}
        setForm={setForm}
        teams={teams}
        isMutating={isMutating}
        attemptCloseForm={attemptCloseForm}
        handleSubmit={handleSubmit}
        createMut={createMut}
        updateMut={updateMut}
      />
      <TransferWindowList
        groupedWindows={groupedWindows}
        isMutating={isMutating}
        openEdit={openEdit}
        deleteMut={deleteMut}
      />
    </div>
  );
}
