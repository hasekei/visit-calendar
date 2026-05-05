"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types";
import { toast } from "sonner";

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("コメントの取得に失敗しました");
      return;
    }
    setComments(data ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchComments().finally(() => setLoading(false));

    const channelName = `comments-realtime-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          setComments((prev) =>
            prev.filter((c) => c.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComments, supabase]);

  const addComment = useCallback(
    async (username: string, message: string) => {
      const { error } = await supabase
        .from("comments")
        .insert({ username, message });
      if (error) toast.error("コメントの送信に失敗しました");
    },
    [supabase]
  );

  const deleteComment = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) toast.error("コメントの削除に失敗しました");
    },
    [supabase]
  );

  return { comments, loading, addComment, deleteComment };
}
