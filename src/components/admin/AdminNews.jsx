import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const CATEGORIES = ["tournament", "patch_update", "roster_change", "announcement", "general"];
const GAMES = ["BGMI", "Valorant", "CSGO", "Free Fire", "PUBG PC", "Apex Legends", "General"];

const EMPTY_FORM = {
  title: "",
  category: "general",
  game: "General",
  created_date: "",
  thumbnail_url: "",
  content: "",
};

export default function AdminNews() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: articles = [] } = useQuery({ queryKey: ["news"], queryFn: () => base44.entities.NewsArticle.list("-created_date", 50) });

  const createArticle = useMutation({
    mutationFn: (data) => base44.entities.NewsArticle.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      resetForm();
      toast({ title: "Article published" });
    },
  });

  const updateArticle = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NewsArticle.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      resetForm();
      toast({ title: "Article updated" });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: (id) => base44.entities.NewsArticle.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      toast({ title: "Article deleted" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (article) => {
    setEditing(article.id);
    setForm({
      title: article.title || "",
      category: article.category || "general",
      game: article.game || "General",
      created_date: article.created_date ? String(article.created_date).slice(0, 10) : "",
      thumbnail_url: article.thumbnail_url || "",
      content: article.content || "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast({ title: "Title and content required", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      created_date: form.created_date || undefined,
    };

    if (editing) {
      updateArticle.mutate({ id: editing, data: payload });
    } else {
      createArticle.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">News Articles ({articles.length})</h2>
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Article</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">{editing ? "Edit" : "New"} Article</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Game</Label>
              <Select value={form.game} onValueChange={(value) => setForm({ ...form, game: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GAMES.map((game) => <SelectItem key={game} value={game}>{game}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Publish Date</Label>
              <Input type="date" value={form.created_date} onChange={(e) => setForm({ ...form, created_date: e.target.value })} />
            </div>
            <div className="md:col-span-2"><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Content *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="min-h-[120px]" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createArticle.isPending || updateArticle.isPending}><Save className="w-4 h-4 mr-2" /> {editing ? "Update" : "Publish"}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {articles.map((article) => (
          <div key={article.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => openEdit(article)} className="min-w-0 flex-1 text-left">
              <span className="font-semibold text-sm">{article.title}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {article.category?.replace(/_/g, " ")} - {article.game || "General"} - {format(new Date(article.created_date), "MMM d, yyyy")}
              </p>
            </button>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(article)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteArticle.mutate(article.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
