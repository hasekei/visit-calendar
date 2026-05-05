"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
const CalendarView = dynamic(
  () => import("@/components/calendar/CalendarView").then((m) => m.CalendarView),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);
import { DayListView } from "@/components/visits/DayListView";
import { VisitDialog } from "@/components/visits/VisitDialog";
import { useVisits } from "@/hooks/useVisits";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, List, Settings } from "lucide-react";
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

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <Tabs defaultValue="calendar">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="calendar" className="flex-1 gap-1.5">
              <Calendar className="h-4 w-4" />
              カレンダー
            </TabsTrigger>
            <TabsTrigger value="day" className="flex-1 gap-1.5">
              <List className="h-4 w-4" />
              日別一覧
            </TabsTrigger>
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
