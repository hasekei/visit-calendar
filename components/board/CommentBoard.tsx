"use client";

import { useState } from "react";
import { useComments } from "@/hooks/useComments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export function CommentBoard() {
  const { comments, loading, addComment, deleteComment } = useComments();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const u = username.trim();
    const m = message.trim();
    if (!u || !m) return;
    setSending(true);
    await addComment(u, m);
    setMessage("");
    toast.success("送信しました");
    setSending(false);
  };

  if (loading) {
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
          <Label htmlFor="board-username">送信者名</Label>
          <Input
            id="board-username"
            placeholder="例: 田中（長男）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-9"
          />
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
          disabled={sending || !username.trim() || !message.trim()}
          size="sm"
          className="w-full"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {sending ? "送信中..." : "送信（Ctrl+Enter）"}
        </Button>
      </div>

      {/* コメント一覧 */}
      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">
          まだ書き込みがありません
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="border rounded-xl p-3.5 bg-card space-y-1 group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{c.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteComment(c.id)}
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
