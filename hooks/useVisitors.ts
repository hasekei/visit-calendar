"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Visitor, VisitorInsert, VisitorUpdate } from "@/types";
import { toast } from "sonner";

export function useVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchVisitors = useCallback(async () => {
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("訪問者の取得に失敗しました");
      return;
    }
    setVisitors(data ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchVisitors().finally(() => setLoading(false));

    const channel = supabase
      .channel("visitors-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitors" },
        () => {
          fetchVisitors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisitors, supabase]);

  const addVisitor = useCallback(
    async (data: VisitorInsert) => {
      const optimistic: Visitor = {
        id: crypto.randomUUID(),
        name: data.name,
        color: data.color ?? "#6366f1",
        sort_order: data.sort_order ?? visitors.length,
        created_at: new Date().toISOString(),
      };
      setVisitors((prev) => [...prev, optimistic]);

      const { error } = await supabase.from("visitors").insert(data);
      if (error) {
        setVisitors((prev) => prev.filter((v) => v.id !== optimistic.id));
        toast.error("訪問者の追加に失敗しました");
      }
    },
    [supabase, visitors.length]
  );

  const updateVisitor = useCallback(
    async (id: string, data: VisitorUpdate) => {
      const prev = visitors.find((v) => v.id === id);
      setVisitors((list) =>
        list.map((v) => (v.id === id ? { ...v, ...data } : v))
      );

      const { error } = await supabase
        .from("visitors")
        .update(data)
        .eq("id", id);
      if (error) {
        if (prev) setVisitors((list) => list.map((v) => (v.id === id ? prev : v)));
        toast.error("訪問者の更新に失敗しました");
      }
    },
    [supabase, visitors]
  );

  const deleteVisitor = useCallback(
    async (id: string) => {
      const prev = visitors.find((v) => v.id === id);
      setVisitors((list) => list.filter((v) => v.id !== id));

      const { error } = await supabase.from("visitors").delete().eq("id", id);
      if (error) {
        if (prev) setVisitors((list) => [...list, prev]);
        toast.error("訪問者の削除に失敗しました");
      }
    },
    [supabase, visitors]
  );

  return { visitors, loading, addVisitor, updateVisitor, deleteVisitor };
}
