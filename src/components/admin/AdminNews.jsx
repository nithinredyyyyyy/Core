import React, { useMemo, useReducer, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Plus,
  Pencil,
  RefreshCw,
  Trash2,
  X,
  Save,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { confirmDiscardIfDirty, createFormSnapshot } from "./formState";
import { getNewsCategoryLabel } from "@/lib/newsCategories";

const CATEGORIES = [
  "tournament",
  "patch_update",
  "roster_change",
  "announcement",
  "general",
];
const GAMES = [
  "BGMI",
  "Valorant",
  "CSGO",
  "Free Fire",
  "PUBG PC",
  "Apex Legends",
  "General",
];
const PUBLICATION_STATES = ["draft", "published"];
const VERIFICATION_STATES = ["needs_review", "verified", "unverified"];
const PRIORITIES = ["breaking", "important", "routine"];
const SOURCE_TYPES = ["rss", "json"];

function formatAdminNewsDate(value) {
  return format(new Date(value), "MMM d, yyyy");
}

function categoryLabel(category) {
  return getNewsCategoryLabel(category);
}

const EMPTY_FORM = {
  title: "",
  summary: "",
  category: "general",
  game: "General",
  created_date: "",
  thumbnail_url: "",
  content: "",
  source_name: "",
  source_url: "",
  source_type: "manual",
  verification_status: "verified",
  publication_status: "published",
  priority: "routine",
};

const MANUAL_IMPORT_INITIAL_STATE = {
  url: "",
  sourceName: "",
  sourceType: "rss",
  category: "general",
  game: "BGMI",
  priority: "routine",
};

const ADMIN_NEWS_INITIAL_STATE = {
  showForm: false,
  editing: null,
  manualImport: MANUAL_IMPORT_INITIAL_STATE,
  form: EMPTY_FORM,
};

function AdminNewsHeader({
  articles,
  isMutating,
  backfillImportedMetadata,
  importArticles,
  openCreate,
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold">News Articles ({articles.length})</h2>
        <p className="text-xs text-muted-foreground">
          Imported stories land as drafts until you review and publish them.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => backfillImportedMetadata.mutate()}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <RefreshCw
            className={`size-4 ${backfillImportedMetadata.isPending ? "animate-spin" : ""}`}
          />
          Refresh Draft Metadata
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => importArticles.mutate()}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <RefreshCw
            className={`size-4 ${importArticles.isPending ? "animate-spin" : ""}`}
          />
          Import Sources
        </Button>
        <Button
          type="button"
          onClick={openCreate}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <Plus className="size-4" />
          New Article
        </Button>
      </div>
    </div>
  );
}

function AdminNewsImportPanel({
  filter,
  setFilter,
  sources,
  manualImport,
  dispatch,
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {["all", "draft", "published"].map((value) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </Button>
        ))}
      </div>
      {sources.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Active sources:{" "}
          {sources
            .reduce((names, source) => {
              if (source.enabled) names.push(source.name);
              return names;
            }, [])
            .join(", ") || "None enabled"}
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-3">
          <Label>Manual RSS / JSON Feed URL</Label>
          <Input
            placeholder="https://news.google.com/rss/search?q=BGMI"
            value={manualImport.url}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: {
                  manualImport: { ...manualImport, url: e.target.value },
                },
              })
            }
          />
        </div>
        <div>
          <Label>Manual Source Name</Label>
          <Input
            placeholder="Manual Feed"
            value={manualImport.sourceName}
            onChange={(e) =>
              dispatch({
                type: "patch",
                payload: {
                  manualImport: {
                    ...manualImport,
                    sourceName: e.target.value,
                  },
                },
              })
            }
          />
        </div>
        <div>
          <Label>Feed Type</Label>
          <Select
            value={manualImport.sourceType}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: {
                  manualImport: { ...manualImport, sourceType: value },
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Import Category</Label>
          <Select
            value={manualImport.category}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: {
                  manualImport: { ...manualImport, category: value },
                },
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
          <Label>Import Game</Label>
          <Select
            value={manualImport.game}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: {
                  manualImport: { ...manualImport, game: value },
                },
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
          <Label>Import Priority</Label>
          <Select
            value={manualImport.priority}
            onValueChange={(value) =>
              dispatch({
                type: "patch",
                payload: {
                  manualImport: { ...manualImport, priority: value },
                },
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
      </div>
    </div>
  );
}

function ImportedDraftsPanel({
  importedDrafts,
  setFilter,
  openEdit,
  handleQuickPublish,
  handleQuickReject,
  isMutating,
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Imported Drafts ({importedDrafts.length})</h3>
          <p className="text-xs text-muted-foreground">
            Fast review lane for auto-ingested stories waiting on an editor.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setFilter("draft")}>
          View all drafts
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {importedDrafts.length > 0 ? (
          importedDrafts.slice(0, 8).map((article) => (
            <div
              key={article.id}
              className="rounded-lg border border-border bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(article)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-semibold">{article.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                    {article.priority || "routine"} - {formatAdminNewsDate(article.created_date)}
                  </p>
                  {article.summary ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {article.summary}
                    </p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{article.verification_status || "needs_review"}</span>
                    <span>{categoryLabel(article.category)}</span>
                  </p>
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleQuickPublish(article)}
                    disabled={isMutating}
                  >
                    <CheckCircle2 className="size-4" />
                    Publish
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleQuickReject(article)}
                    disabled={isMutating}
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(article)}
                    disabled={isMutating}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-muted-foreground">
            No imported drafts waiting right now.
          </div>
        )}
      </div>
    </div>
  );
}

function AdminNewsForm({
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

function AdminNewsList({
  visibleArticles,
  openEdit,
  handleQuickPublish,
  handleQuickReject,
  isMutating,
  deleteArticle,
}) {
  return (
    <div className="space-y-2">
      {visibleArticles.map((article) => (
        <div
          key={article.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
        >
          <button
            type="button"
            onClick={() => openEdit(article)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="font-semibold text-sm">{article.title}</span>
            <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
              {categoryLabel(article.category)} - {article.game || "General"} -{" "}
              {formatAdminNewsDate(article.created_date)}
            </p>
            <p className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>{article.publication_status || "published"}</span>
              <span>{article.verification_status || "verified"}</span>
              <span>{article.priority || "routine"}</span>
            </p>
          </button>
          <div className="flex gap-1">
            {article.publication_status === "draft" ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuickPublish(article)}
                  disabled={isMutating}
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuickReject(article)}
                  disabled={isMutating}
                >
                  <XCircle className="size-4 text-amber-600" />
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => openEdit(article)}
              disabled={isMutating}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => deleteArticle.mutate(article.id)}
              disabled={isMutating}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function adminNewsReducer(state, action) {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.payload };
    case "resetForm":
      return {
        ...state,
        showForm: false,
        editing: null,
        form: EMPTY_FORM,
      };
    default:
      return state;
  }
}

export default function AdminNews() {
  const [uiState, dispatch] = useReducer(
    adminNewsReducer,
    ADMIN_NEWS_INITIAL_STATE,
  );
  const [filter, setFilter] = useState("all");
  const initialFormSnapshotRef = useRef(createFormSnapshot(EMPTY_FORM));
  const { toast } = useToast();
  const qc = useQueryClient();
  const { showForm, editing, manualImport, form } = uiState;

  const { data: articles = [] } = useQuery({
    queryKey: ["news", "admin"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 80),
  });
  const { data: sources = [] } = useQuery({
    queryKey: ["news-sources"],
    queryFn: () => base44.news.adminSources(),
  });

  const createArticle = useMutation({
    mutationFn: (data) => base44.entities.NewsArticle.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      resetForm();
      toast({ title: "Article saved" });
    },
  });

  const updateArticle = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NewsArticle.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      resetForm();
      toast({ title: "Article updated" });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: (id) => base44.entities.NewsArticle.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      toast({ title: "Article deleted" });
    },
  });

  const quickUpdateArticle = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NewsArticle.update(id, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      toast({ title: variables?.toastTitle || "Article updated" });
    },
  });

  const importArticles = useMutation({
    mutationFn: () =>
      base44.news.importFromSources({
        ...(manualImport.url
          ? {
              manual_url: manualImport.url,
              manual_source_name: manualImport.sourceName || "Manual Feed",
              manual_source_type: manualImport.sourceType,
              manual_category: manualImport.category,
              manual_game: manualImport.game,
              manual_priority: manualImport.priority,
            }
          : {}),
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      toast({
        title: "Import complete",
        description: `${result.importedCount} draft stor${result.importedCount === 1 ? "y" : "ies"} imported.`,
      });
      dispatch({
        type: "patch",
        payload: {
          manualImport: { ...manualImport, url: "", sourceName: "" },
        },
      });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const backfillImportedMetadata = useMutation({
    mutationFn: () => base44.news.backfillImportedMetadata(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      toast({
        title: "Imported drafts normalized",
        description: `${result.updatedCount} stor${result.updatedCount === 1 ? "y" : "ies"} refreshed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isMutating =
    createArticle.isPending ||
    updateArticle.isPending ||
    deleteArticle.isPending ||
    importArticles.isPending ||
    backfillImportedMetadata.isPending ||
    quickUpdateArticle.isPending;

  const resetForm = () => {
    dispatch({ type: "resetForm" });
    initialFormSnapshotRef.current = createFormSnapshot(EMPTY_FORM);
  };

  const isFormDirty = createFormSnapshot(form) !== initialFormSnapshotRef.current;

  const attemptCloseForm = () => {
    if (!confirmDiscardIfDirty(isFormDirty)) return;
    resetForm();
  };

  const openCreate = () => {
    if (showForm && !confirmDiscardIfDirty(isFormDirty)) return;
    dispatch({
      type: "patch",
      payload: { editing: null, form: EMPTY_FORM, showForm: true },
    });
    initialFormSnapshotRef.current = createFormSnapshot(EMPTY_FORM);
  };

  const openEdit = (article) => {
    if (
      showForm &&
      editing !== article.id &&
      !confirmDiscardIfDirty(isFormDirty)
    )
      return;
    const nextForm = {
      title: article.title || "",
      summary: article.summary || "",
      category: article.category || "general",
      game: article.game || "General",
      created_date: article.created_date
        ? String(article.created_date).slice(0, 10)
        : "",
      thumbnail_url: article.thumbnail_url || "",
      content: article.content || "",
      source_name: article.source_name || "",
      source_url: article.source_url || "",
      source_type: article.source_type || "manual",
      verification_status: article.verification_status || "verified",
      publication_status: article.publication_status || "published",
      priority: article.priority || "routine",
    };
    dispatch({
      type: "patch",
      payload: { editing: article.id, form: nextForm, showForm: true },
    });
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
  };

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast({ title: "Title and content required", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      created_date: form.created_date || undefined,
      is_auto_ingested: form.source_type === "manual" ? 0 : 1,
    };

    if (editing) {
      updateArticle.mutate({ id: editing, data: payload });
    } else {
      createArticle.mutate(payload);
    }
  };

  const visibleArticles = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((article) => article.publication_status === filter);
  }, [articles, filter]);
  const importedDrafts = useMemo(
    () =>
      articles.filter(
        (article) =>
          article.is_auto_ingested && article.publication_status === "draft",
      ),
    [articles],
  );

  const handleQuickPublish = (article) => {
    quickUpdateArticle.mutate({
      id: article.id,
      data: {
        publication_status: "published",
        verification_status:
          article.verification_status === "unverified"
            ? "needs_review"
            : "verified",
      },
      toastTitle: "Draft published",
    });
  };

  const handleQuickReject = (article) => {
    quickUpdateArticle.mutate({
      id: article.id,
      data: {
        publication_status: "draft",
        verification_status: "unverified",
      },
      toastTitle: "Draft marked unverified",
    });
  };

  return (
    <div className="space-y-4">
      <AdminNewsHeader
        articles={articles}
        isMutating={isMutating}
        backfillImportedMetadata={backfillImportedMetadata}
        importArticles={importArticles}
        openCreate={openCreate}
      />
      <AdminNewsImportPanel
        filter={filter}
        setFilter={setFilter}
        sources={sources}
        manualImport={manualImport}
        dispatch={dispatch}
      />
      <ImportedDraftsPanel
        importedDrafts={importedDrafts}
        setFilter={setFilter}
        openEdit={openEdit}
        handleQuickPublish={handleQuickPublish}
        handleQuickReject={handleQuickReject}
        isMutating={isMutating}
      />
      <AdminNewsForm
        showForm={showForm}
        editing={editing}
        form={form}
        dispatch={dispatch}
        isMutating={isMutating}
        attemptCloseForm={attemptCloseForm}
        handleSubmit={handleSubmit}
        createArticle={createArticle}
        updateArticle={updateArticle}
      />
      <AdminNewsList
        visibleArticles={visibleArticles}
        openEdit={openEdit}
        handleQuickPublish={handleQuickPublish}
        handleQuickReject={handleQuickReject}
        isMutating={isMutating}
        deleteArticle={deleteArticle}
      />
    </div>
  );
}
