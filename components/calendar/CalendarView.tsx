"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";
import type { CalendarApi, EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { VisitWithVisitor, CalendarEvent } from "@/types";
import { VisitDialog } from "@/components/visits/VisitDialog";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  visits: VisitWithVisitor[];
}

function toCalendarEvents(visits: VisitWithVisitor[]): CalendarEvent[] {
  return visits.map((v) => ({
    id: v.id,
    title: v.visitor.name,
    start: v.start_time,
    end: v.end_time,
    backgroundColor: v.visitor.color,
    borderColor: v.visitor.color,
    extendedProps: {
      visitId: v.id,
      visitorId: v.visitor_id,
      memo: v.memo,
      color: v.visitor.color,
    },
  }));
}

export function CalendarView({ visits }: CalendarViewProps) {
  const calRef = useRef<FullCalendar>(null);
  const { setSelectedDate } = useSelectedDate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date>(new Date());
  const [editVisit, setEditVisit] = useState<VisitWithVisitor | undefined>();
  const [currentTitle, setCurrentTitle] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  });
  const [currentView, setCurrentView] = useState("dayGridMonth");

  const getApi = (): CalendarApi | null => calRef.current?.getApi() ?? null;

  const updateTitle = () => {
    const api = getApi();
    if (api) setCurrentTitle(api.view.title);
  };

  const handlePrev = () => {
    getApi()?.prev();
    updateTitle();
  };
  const handleNext = () => {
    getApi()?.next();
    updateTitle();
  };
  const handleToday = () => {
    getApi()?.today();
    updateTitle();
  };
  const handleViewChange = (view: string) => {
    getApi()?.changeView(view);
    setCurrentView(view);
    updateTitle();
  };

  const handleDateClick = (arg: DateClickArg) => {
    const date = arg.date;
    setSelectedDate(date);
    setDialogDate(date);
    setEditVisit(undefined);
    setDialogOpen(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const visitId = arg.event.extendedProps.visitId as string;
    const visit = visits.find((v) => v.id === visitId);
    if (visit) {
      setEditVisit(visit);
      setDialogDate(new Date(visit.start_time));
      setDialogOpen(true);
    }
  };

  const viewButtons = [
    { key: "dayGridMonth", label: "月" },
    { key: "timeGridWeek", label: "週" },
    { key: "timeGridDay", label: "日" },
  ];

  return (
    <div className="space-y-2">
      {/* カスタムツールバー */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleToday}>
            今日
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2">{currentTitle}</span>
        </div>

        <div className="flex gap-1">
          {viewButtons.map((v) => (
            <Button
              key={v.key}
              size="sm"
              className="h-8 px-3"
              variant={currentView === v.key ? "default" : "outline"}
              onClick={() => handleViewChange(v.key)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={jaLocale}
          headerToolbar={false}
          events={toCalendarEvents(visits)}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          dayMaxEvents={3}
          height="auto"
          aspectRatio={1.5}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator
          datesSet={updateTitle}
          eventContent={(arg) => (
            <div
              className="px-1 py-0.5 rounded text-white text-xs truncate w-full"
              style={{ backgroundColor: arg.event.backgroundColor }}
            >
              {arg.timeText && (
                <span className="opacity-80 mr-1">{arg.timeText}</span>
              )}
              {arg.event.title}
            </div>
          )}
        />
      </div>

      <VisitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultDate={dialogDate}
        editVisit={editVisit}
      />
    </div>
  );
}
