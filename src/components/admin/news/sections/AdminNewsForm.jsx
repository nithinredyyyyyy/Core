import React from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, categoryLabel, GAMES, PUBLICATION_STATES, VERIFICATION_STATES, PRIORITIES } from "@/components/admin/news/utils/newsEditorHelpers";

export function AdminNewsForm({
  showForm,
  editing,
  form,
  dispatch,
  isMutating,
  attemptCloseForm,
  handleSubmit,
  createArticle,
  updateArticle,
}) {
  if (!showForm) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex justify-between">
        <h3 className="font-semibold">{editing ? "Edit" : "New"} Article</h3>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Title *</Label>
          <Input
            value={form.title}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, title: e.target.value } },
              })
            }
          />
        </div>
        <div className="md:col-span-2">
          <Label>Summary</Label>
          <Textarea
            value={form.summary}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, summary: e.target.value } },
              })
            }
            className="min-h-[90px]"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, category: value } },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {categoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Game</Label>
          <Select
            value={form.game}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, game: value } },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
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
          <Label>Publication</Label>
          <Select
            value={form.publication_status}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: {
                  form: { ...form, publication_status: value },
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PUBLICATION_STATES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Verification</Label>
          <Select
            value={form.verification_status}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: {
                  form: { ...form, verification_status: value },
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERIFICATION_STATES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Publish Date</Label>
          <Input
            type="date"
            value={form.created_date}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, created_date: e.target.value } },
              })
            }
          />
        </div>
        <div>
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, priority: value } },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Thumbnail URL</Label>
          <Input
            value={form.thumbnail_url}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, thumbnail_url: e.target.value } },
              })
            }
          />
        </div>
        <div>
          <Label>Source Name</Label>
          <Input
            value={form.source_name}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, source_name: e.target.value } },
              })
            }
          />
        </div>
        <div>
          <Label>Source URL</Label>
          <Input
            value={form.source_url}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, source_url: e.target.value } },
              })
            }
          />
        </div>
        <div className="md:col-span-2">
          <Label>Content *</Label>
          <Textarea
            value={form.content}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: { form: { ...form, content: e.target.value } },
              })
            }
            className="min-h-[140px]"
          />
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
          disabled={createArticle.isPending || updateArticle.isPending}
        >
          <Save className="mr-2 size-4" />
          {editing ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );
}
