"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitSchema, type VisitFormValues } from "@/lib/validations/visit";
import { generateTimeOptions, buildDateTime, toLocalDateString } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { VisitorSelect } from "@/components/visitors/VisitorSelect";
import type { VisitWithVisitor } from "@/types";
import { CalendarDays, X, Plus } from "lucide-react";

const TIME_OPTIONS = generateTimeOptions();

interface VisitFormProps {
  defaultDate?: Date;
  editVisit?: VisitWithVisitor;
  onSubmit: (data: VisitFormValues) => Promise<void>;
  onBatchSubmit?: (dates: string[], data: Omit<VisitFormValues, "date">) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

function toTimeString(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function addMinutes(time: string, minutes: number): string | null {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  if (endH > 22 || (endH === 22 && endM > 0)) return null;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function formatDateChip(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

export function VisitForm({
  defaultDate,
  editVisit,
  onSubmit,
  onBatchSubmit,
  onCancel,
  onDelete,
}: VisitFormProps) {
  const { settings } = useSettings();
  const isMounted = useRef(false);
  const addDateRef = useRef<HTMLInputElement>(null);

  const defaultDateStr = editVisit
    ? toLocalDateString(new Date(editVisit.start_time))
    : toLocalDateString(defaultDate ?? new Date());

  const [isMultiDate, setIsMultiDate] = useState(false);
  const [multiDates, setMultiDates] = useState<string[]>([defaultDateStr]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: editVisit
      ? {
          visitor_id: editVisit.visitor_id,
          date: toLocalDateString(new Date(editVisit.start_time)),
          start_time: toTimeString(editVisit.start_time),
          end_time: toTimeString(editVisit.end_time),
          memo: editVisit.memo ?? "",
        }
      : {
          visitor_id: "",
          date: defaultDateStr,
          start_time: "10:00",
          end_time: addMinutes("10:00", settings.defaultDurationMinutes) ?? "10:30",
          memo: "",
        },
  });

  const startTime = watch("start_time");
  const endTimeOptions = TIME_OPTIONS.filter((t) => t > startTime);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!startTime) return;
    const autoEnd = addMinutes(startTime, settings.defaultDurationMinutes);
    if (autoEnd) setValue("end_time", autoEnd, { shouldValidate: true });
  }, [startTime, settings.defaultDurationMinutes, setValue]);

  // マルチ日付モード時はdateフィールドを先頭日付に同期
  useEffect(() => {
    if (isMultiDate && multiDates.length > 0) {
      setValue("date", multiDates[0], { shouldValidate: false });
    }
  }, [isMultiDate, multiDates, setValue]);

  const handleToggleMultiDate = () => {
    const next = !isMultiDate;
    setIsMultiDate(next);
    if (next) {
      setMultiDates([watch("date") || defaultDateStr]);
    } else {
      if (multiDates.length > 0) {
        setValue("date", multiDates[0], { shouldValidate: false });
      }
    }
  };

  const addDate = (dateStr: string) => {
    if (!dateStr || multiDates.includes(dateStr) || multiDates.length >= 7) return;
    setMultiDates((prev) => [...prev, dateStr].sort());
    if (addDateRef.current) addDateRef.current.value = "";
  };

  const removeDate = (dateStr: string) => {
    setMultiDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const handleFormSubmit = handleSubmit(async (data) => {
    if (isMultiDate && onBatchSubmit && multiDates.length > 0) {
      const { date: _date, ...rest } = data;
      await onBatchSubmit(multiDates, rest);
    } else {
      await onSubmit(data);
    }
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>訪問者</Label>
        <VisitorSelect
          value={watch("visitor_id")}
          onChange={(v) => setValue("visitor_id", v, { shouldValidate: true })}
          error={errors.visitor_id?.message}
          fallbackVisitor={editVisit?.visitor}
        />
      </div>

      {/* 日付（新規登録時のみ複数日対応） */}
      <div className="space-y-1.5">
        {!editVisit ? (
          <>
            <div className="flex items-center justify-between">
              <Label>日付</Label>
              <button
                type="button"
                onClick={handleToggleMultiDate}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  isMultiDate
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                複数日を選択
              </button>
            </div>

            {isMultiDate ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/30 min-h-10">
                  {multiDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-full"
                    >
                      {formatDateChip(d)}
                      <button
                        type="button"
                        onClick={() => removeDate(d)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {multiDates.length < 7 && (
                    <label className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-dashed border-muted-foreground text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      <Plus className="h-3 w-3" />
                      追加
                      <input
                        ref={addDateRef}
                        type="date"
                        className="sr-only"
                        onChange={(e) => {
                          addDate(e.target.value);
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {multiDates.length}/7日 選択中
                  {multiDates.length === 0 && (
                    <span className="text-destructive ml-1">日付を1つ以上選択してください</span>
                  )}
                </p>
              </div>
            ) : (
              <>
                <Input
                  type="date"
                  {...register("date")}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-xs text-destructive mt-0.5">{errors.date.message}</p>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && (
              <p className="text-xs text-destructive mt-0.5">{errors.date.message}</p>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>開始時刻</Label>
          <Select
            value={startTime || null}
            onValueChange={(v) => {
              if (v) setValue("start_time", v, { shouldValidate: true });
            }}
          >
            <SelectTrigger className={errors.start_time ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-52">
              {TIME_OPTIONS.slice(0, -1).map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.start_time && (
            <p className="text-xs text-destructive">{errors.start_time.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>終了時刻</Label>
          <Select
            value={watch("end_time") || null}
            onValueChange={(v) => {
              if (v) setValue("end_time", v, { shouldValidate: true });
            }}
          >
            <SelectTrigger className={errors.end_time ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-52">
              {endTimeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.end_time && (
            <p className="text-xs text-destructive">{errors.end_time.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="memo">メモ（任意）</Label>
        <Textarea
          id="memo"
          placeholder="備考を入力..."
          rows={3}
          {...register("memo")}
          className="resize-none"
        />
        {errors.memo && (
          <p className="text-xs text-destructive">{errors.memo.message}</p>
        )}
      </div>

      <div className="flex justify-between items-center pt-1">
        {onDelete ? (
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            削除
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || (isMultiDate && multiDates.length === 0)}
          >
            {isSubmitting
              ? "保存中..."
              : isMultiDate && multiDates.length > 1
              ? `${multiDates.length}日分を保存`
              : "保存"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export { buildDateTime };
