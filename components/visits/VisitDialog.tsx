"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisitForm } from "./VisitForm";
import { useVisits } from "@/hooks/useVisits";
import { buildDateTime } from "@/lib/utils";
import type { VisitFormValues } from "@/lib/validations/visit";
import type { VisitWithVisitor } from "@/types";
import { toast } from "sonner";

interface VisitDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
  editVisit?: VisitWithVisitor;
}

export function VisitDialog({ open, onClose, defaultDate, editVisit }: VisitDialogProps) {
  const { addVisit, updateVisit, deleteVisit } = useVisits();

  const title = editVisit ? "面会を編集" : "面会を追加";

  const handleSubmit = async (data: VisitFormValues) => {
    const start_time = buildDateTime(data.date, data.start_time);
    const end_time = buildDateTime(data.date, data.end_time);

    if (editVisit) {
      await updateVisit(editVisit.id, {
        visitor_id: data.visitor_id,
        start_time,
        end_time,
        memo: data.memo ?? null,
      });
      toast.success("面会を更新しました");
    } else {
      await addVisit({
        visitor_id: data.visitor_id,
        start_time,
        end_time,
        memo: data.memo ?? null,
      });
      toast.success("面会を追加しました");
    }
    onClose();
  };

  const handleBatchSubmit = async (
    dates: string[],
    baseData: Omit<VisitFormValues, "date">
  ) => {
    for (const date of dates) {
      await addVisit({
        visitor_id: baseData.visitor_id,
        start_time: buildDateTime(date, baseData.start_time),
        end_time: buildDateTime(date, baseData.end_time),
        memo: baseData.memo ?? null,
      });
    }
    toast.success(`${dates.length}件の面会を追加しました`);
    onClose();
  };

  const handleDelete = async () => {
    if (!editVisit) return;
    await deleteVisit(editVisit.id);
    toast.success("面会を削除しました");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {/*
        モバイル: 画面下部に固定・フル幅・スクロール可
        sm以上: 中央寄せの通常Dialogレイアウト
      */}
      <DialogContent
        className="
          bottom-0 left-0 right-0 top-auto
          translate-x-0 translate-y-0
          max-w-none w-full
          rounded-t-2xl rounded-b-none
          max-h-[92dvh] overflow-y-auto
          sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:max-w-md
          sm:rounded-xl sm:max-h-none sm:overflow-y-visible
        "
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <VisitForm
          defaultDate={defaultDate}
          editVisit={editVisit}
          onSubmit={handleSubmit}
          onBatchSubmit={handleBatchSubmit}
          onCancel={onClose}
          onDelete={editVisit ? handleDelete : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
