import { z } from "zod";

export const visitSchema = z
  .object({
    visitor_id: z.string().uuid({ message: "訪問者を選択してください" }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "日付を選択してください" }),
    start_time: z.string().min(1, { message: "開始時刻を選択してください" }),
    end_time: z.string().min(1, { message: "終了時刻を選択してください" }),
    memo: z.string().max(200).optional(),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: "終了時刻は開始時刻より後にしてください",
    path: ["end_time"],
  });

export type VisitFormValues = z.infer<typeof visitSchema>;

export const visitorSchema = z.object({
  name: z.string().min(1, { message: "名前を入力してください" }).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "色を選択してください" }),
});

export type VisitorFormValues = z.infer<typeof visitorSchema>;
