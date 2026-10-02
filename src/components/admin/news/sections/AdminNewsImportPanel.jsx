import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOURCE_TYPES, CATEGORIES, categoryLabel, GAMES, PRIORITIES } from "@/components/admin/news/utils/newsEditorHelpers";

export function AdminNewsImportPanel({
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
