"use client";

import { useEffect, useRef } from "react";
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

const TIME_OPTIONS = generateTimeOptions();

interface VisitFormProps {
  defaultDate?: Date;
  editVisit?: VisitWithVisitor;
  onSubmit: (data: VisitFormValues) => Promise<void>;
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

export function VisitForm({
  defaultDate,
  editVisit,
  onSubmit,
  onCancel,
  onDelete,
}: VisitFormProps) {
  const { settings } = useSettings();
  const isMounted = useRef(false);

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
          date: toLocalDateString(defaultDate ?? new Date()),
          start_time: "10:00",
          end_time: addMinutes("10:00", settings.defaultDurationMinutes) ?? "10:30",
          memo: "",
        },
  });

  const startTime = watch("start_time");
  const endTimeOptions = TIME_OPTIONS.filter((t) => t > startTime);

  // 開始時刻が変わったら終了時刻を自動更新（マウント直後の初期値セットは除外）
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!startTime) return;
    const autoEnd = addMinutes(startTime, settings.defaultDurationMinutes);
    if (autoEnd) setValue("end_time", autoEnd, { shouldValidate: true });
  }, [startTime, settings.defaultDurationMinutes, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>訪問者</Label>
        <VisitorSelect
          value={watch("visitor_id")}
          onChange={(v) => setValue("visitor_id", v, { shouldValidate: true })}
          error={errors.visitor_id?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">日付</Label>
        <Input
          id="date"
          type="date"
          {...register("date")}
          className={errors.date ? "border-destructive" : ""}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date.message}</p>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export { buildDateTime };
