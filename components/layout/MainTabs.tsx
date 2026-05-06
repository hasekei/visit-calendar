"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
const CalendarView = dynamic(
  () => import("@/components/calendar/CalendarView").then((m) => m.CalendarView),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);
import { DayListView } from "@/components/visits/DayListView";
import { VisitorNotesTab } from "@/components/notes/VisitorNotesTab";
import { CommentBoard } from "@/components/board/CommentBoard";
import { VisitDialog } from "@/components/visits/VisitDialog";
import { useVisits } from "@/hooks/useVisits";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, List, FileText, MessageSquare, Settings, ExternalLink } from "lucide-react";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { Skeleton } from "@/components/ui/skeleton";

export function MainTabs() {
  const { visits, loading } = useVisits();
  const { selectedDate } = useSelectedDate();
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-lg">面会管理カレンダー</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          </div>
        </div>
      </header>

      {/* 案内リンクバー */}
      <div className="border-b bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-3 flex-wrap">
          <a
            href="https://nih.or.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            大阪整形外科病院
          </a>
          <a
            href="https://nih.or.jp/access/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            アクセス
          </a>
          <a
            href="https://nih.or.jp/cms/wp-content/uploads/2025/09/10visitation.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            面会規則
          </a>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <Tabs defaultValue="calendar">
          <TabsList className="w-full mb-4">
            {(["calendar", "day", "notes", "board"] as const).map((v) => {
              const items = {
                calendar: { icon: <Calendar className="h-3.5 w-3.5 shrink-0" />, label: "カレンダー" },
                day:      { icon: <List      className="h-3.5 w-3.5 shrink-0" />, label: "日別" },
                notes:    { icon: <FileText  className="h-3.5 w-3.5 shrink-0" />, label: "留意事項" },
                board:    { icon: <MessageSquare className="h-3.5 w-3.5 shrink-0" />, label: "掲示板" },
              };
              return (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="flex-1 gap-1 text-xs sm:text-sm data-active:bg-primary data-active:text-primary-foreground data-active:font-semibold data-active:shadow-none"
                >
                  {items[v].icon}
                  <span>{items[v].label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="calendar">
            <CalendarView visits={visits} />
          </TabsContent>

          <TabsContent value="day">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <DayListView visits={visits} />
            )}
          </TabsContent>

          <TabsContent value="notes">
            <VisitorNotesTab />
          </TabsContent>

          <TabsContent value="board">
            <CommentBoard />
          </TabsContent>
        </Tabs>
      </main>

      <VisitDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultDate={selectedDate}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
