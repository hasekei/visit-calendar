"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";
import type { VisitWithVisitor } from "@/types";
import { VisitDialog } from "./VisitDialog";
import { Clock, MessageSquare } from "lucide-react";

interface VisitCardProps {
  visit: VisitWithVisitor;
}

export function VisitCard({ visit }: VisitCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="w-full text-left rounded-lg border bg-card hover:shadow-sm transition-shadow p-3 space-y-1"
        style={{ borderLeftWidth: 4, borderLeftColor: visit.visitor.color }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: visit.visitor.color }}
          />
          <span className="font-medium text-sm">{visit.visitor.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(visit.start_time)} 〜 {formatTime(visit.end_time)}
        </div>
        {visit.memo && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{visit.memo}</span>
          </div>
        )}
      </button>

      <VisitDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editVisit={visit}
      />
    </>
  );
}
