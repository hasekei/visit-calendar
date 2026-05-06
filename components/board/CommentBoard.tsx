"use client";

import { useState, useEffect } from "react";
import { useComments } from "@/hooks/useComments";
import { useVisitors } from "@/hooks/useVisitors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Send, Eye } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "board-visitor-id";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "たった今";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentBoard() {
  const { comments, loading, addComment, deleteComment, toggleSeen, toggleSeenBatch } = useComments();
  const { visitors, loading: visitorsLoading } = useVisitors();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSelectedVisitorId(saved);
  }, []);

  const handleVisitorChange = (id: string) => {
    setSelectedVisitorId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedVisitor = visitors.find((v) => v.id === selectedVisitorId);
  const selectedName = selectedVisitor?.name ?? "";

  const handleSend = async () => {
    if (!selectedName || !message.trim()) return;
    setSending(true);
    await addComment(selectedName, message.trim());
    setMessage("");
    toast.success("送信しました");
    setSending(false);
  };

  const handleToggleSeen = async (
    commentId: string,
    seenBy: string[],
    isNewest: boolean
  ) => {
    if (!selectedName) {
      toast.error("「訪問者」を選択してから「見たよ」を押してください");
      return;
    }
    if (isNewest) {
      // 最新コメントへの「見たよ」は全コメントに一括反映
      const alreadySeen = seenBy.includes(selectedName);
      await toggleSeenBatch(comments, selectedName, !alreadySeen);
    } else {
      await toggleSeen(commentId, selectedName, seenBy);
    }
  };

  if (loading || visitorsLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 入力フォーム */}
      <div className="border rounded-xl p-4 space-y-3 bg-card">
        <div className="space-y-1.5">
          <Label>訪問者</Label>
          <Select
            value={selectedVisitorId || null}
            onValueChange={(v) => { if (v) handleVisitorChange(v); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="名前を選択してください">
                {selectedVisitor ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
                      style={{ backgroundColor: selectedVisitor.color }}
                    />
                    {selectedVisitor.name}
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {visitors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
                      style={{ backgroundColor: v.color }}
                    />
                    {v.name}
                  </span>
                </SelectItem>
              ))}
              {visitors.length === 0 && (
                <div className="text-sm text-muted-foreground px-2 py-1.5">
                  訪問者がいません
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="board-message">メッセージ</Label>
          <Textarea
            id="board-message"
            placeholder="伝言・連絡事項など..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) handleSend();
            }}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={sending || !selectedName || !message.trim()}
          size="sm"
          className="w-full"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {sending ? "送信中..." : "送信（Ctrl+Enter）"}
        </Button>
      </div>

      {/* コメント一覧（スクロール可能） */}
      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">
          まだ書き込みがありません
        </p>
      ) : (
        <div className="max-h-[60dvh] overflow-y-auto space-y-3 pr-0.5">
          {comments.map((c, i) => {
            const seenBy = c.seen_by ?? [];
            const alreadySeen = !!selectedName && seenBy.includes(selectedName);
            const isNewest = i === 0;
            const isAuthor = !!selectedName && c.username === selectedName;
            return (
              <div
                key={c.id}
                className={`border rounded-xl p-3.5 bg-card space-y-2 ${
                  isNewest ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isNewest && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold leading-none shrink-0">
                        NEW
                      </span>
                    )}
                    <span className="text-sm font-semibold truncate">{c.username}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTime(c.created_at)}
                    </span>
                    {/* 投稿者本人のみ削除ボタンを表示 */}
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c.id)}
                        className="text-destructive transition-opacity"
                        title="削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.message}</p>
                {/* 見たよ（投稿者本人は押せない） */}
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleSeen(c.id, seenBy, isNewest)}
                    disabled={isAuthor}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      alreadySeen
                        ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    }`}
                    title={
                      isAuthor
                        ? "投稿者本人は押せません"
                        : isNewest
                        ? "押すと全メッセージに「見たよ」が付きます"
                        : "見たよ"
                    }
                  >
                    <Eye className="h-3 w-3" />
                    {isNewest ? "全部見たよ" : "見たよ"}
                    {seenBy.length > 0 ? `（${seenBy.length}）` : ""}
                  </button>
                  {seenBy.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {seenBy.join("・")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
