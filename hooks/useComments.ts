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
        { event: "UPDATE", schema: "public", table: "comments" },
        (payload) => {
          setComments((prev) =>
            prev.map((c) =>
              c.id === (payload.new as Comment).id ? (payload.new as Comment) : c
            )
          );
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

  const toggleSeen = useCallback(
    async (id: string, visitorName: string, currentSeenBy: string[]) => {
      const already = currentSeenBy.includes(visitorName);
      const newSeenBy = already
        ? currentSeenBy.filter((n) => n !== visitorName)
        : [...currentSeenBy, visitorName];

      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, seen_by: newSeenBy } : c))
      );

      const { error } = await supabase
        .from("comments")
        .update({ seen_by: newSeenBy })
        .eq("id", id);

      if (error) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, seen_by: currentSeenBy } : c))
        );
        toast.error("更新に失敗しました");
      }
    },
    [supabase]
  );

  return { comments, loading, addComment, deleteComment, toggleSeen };
}
