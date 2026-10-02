import React, { useMemo, useReducer, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { confirmDiscardIfDirty, createFormSnapshot } from "@/components/admin/formState";
import { adminNewsReducer, ADMIN_NEWS_INITIAL_STATE, EMPTY_FORM } from "@/components/admin/news/utils/newsEditorHelpers";
import { AdminNewsHeader } from "@/components/admin/news/sections/AdminNewsHeader";
import { AdminNewsImportPanel } from "@/components/admin/news/sections/AdminNewsImportPanel";
import { ImportedDraftsPanel } from "@/components/admin/news/sections/ImportedDraftsPanel";
import { AdminNewsForm } from "@/components/admin/news/sections/AdminNewsForm";
import { AdminNewsList } from "@/components/admin/news/sections/AdminNewsList";

export default function AdminNews() {
  const [uiState, dispatch] = useReducer(
    adminNewsReducer,
    ADMIN_NEWS_INITIAL_STATE,
  );
  const [filter, setFilter] = useState("all");
  const initialFormSnapshotRef = useRef(null);
  if (initialFormSnapshotRef.current === null) {
    initialFormSnapshotRef.current = createFormSnapshot(EMPTY_FORM);
  }
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
    onError: (error) => {
      toast({
        title: "Failed to save article",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
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
    onError: (error) => {
      toast({
        title: "Failed to update article",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: (id) => base44.entities.NewsArticle.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      toast({ title: "Article deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete article",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const quickUpdateArticle = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NewsArticle.update(id, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news", "admin"] });
      toast({ title: variables?.toastTitle || "Article updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update article",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
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
        description: error?.message,
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
        description: error?.message,
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
