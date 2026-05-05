"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  const isMobile = useMediaQuery("(max-width: 768px)");

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

  const handleDelete = async () => {
    if (!editVisit) return;
    await deleteVisit(editVisit.id);
    toast.success("面会を削除しました");
    onClose();
  };

  const formContent = (
    <VisitForm
      defaultDate={defaultDate}
      editVisit={editVisit}
      onSubmit={handleSubmit}
      onCancel={onClose}
      onDelete={editVisit ? handleDelete : undefined}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
