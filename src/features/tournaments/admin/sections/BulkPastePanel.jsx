import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BulkPastePanel({ dispatch, importMutation, isMutating, pasteText }) {
  return (
    <div>
      <Label>Pasted table</Label>
      <Textarea
        value={pasteText}
        onChange={(event) =>
          dispatch({
            type: "setField",
            field: "pasteText",
            value: event.target.value,
          })
        }
        className="mt-2 min-h-[260px] font-mono text-xs"
        disabled={isMutating || importMutation.isPending}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Standings headers: <code># Team GRP M WWCD Place Elims Pts</code>. Rankings can include custom headers; participant rows use <code>Seed Team Stage Group Players</code>.
      </p>
    </div>
  );
}
