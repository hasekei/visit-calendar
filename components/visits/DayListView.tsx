"use client";

import { useState } from "react";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { formatDate, toLocalDateString } from "@/lib/utils";
import type { VisitWithVisitor } from "@/types";
import { VisitCard } from "./VisitCard";
import { VisitDialog } from "./VisitDialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DayListViewProps {
  visits: VisitWithVisitor[];
}

export function DayListView({ visits }: DayListViewProps) {
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [addOpen, setAddOpen] = useState(false);

  const dateStr = toLocalDateString(selectedDate);
  const dayVisits = visits
    .filter((v) => {
      const vDate = toLocalDateString(new Date(v.start_time));
      return vDate === dateStr;
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  return (
    <div className="space-y-4">
      {/* 日付選択 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">{formatDate(selectedDate.toISOString())}</h2>
        </div>
        <Input
          type="date"
          value={dateStr}
          onChange={(e) => {
            if (e.target.value) setSelectedDate(new Date(e.target.value + "T00:00:00"));
          }}
          className="w-40 h-8 text-sm"
        />
      </div>

      {/* 面会一覧 */}
      {dayVisits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
          <CalendarDays className="h-10 w-10 opacity-30" />
          <p className="text-sm">この日の面会予定はありません</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            面会を追加
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {dayVisits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            面会を追加
          </Button>
        </div>
      )}

      <VisitDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
}
