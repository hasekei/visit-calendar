"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VisitWithVisitor, VisitInsert, VisitUpdate } from "@/types";
import { toast } from "sonner";

export function useVisits() {
  const [visits, setVisits] = useState<VisitWithVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchVisitById = useCallback(
    async (id: string): Promise<VisitWithVisitor | null> => {
      const { data, error } = await supabase
        .from("visits")
        .select("*, visitor:visitors(*)")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as VisitWithVisitor;
    },
    [supabase]
  );

  const fetchAllVisits = useCallback(async () => {
    const { data, error } = await supabase
      .from("visits")
      .select("*, visitor:visitors(*)")
      .order("start_time", { ascending: true });
    if (error) {
      toast.error("面会データの取得に失敗しました");
      return;
    }
    setVisits((data ?? []) as VisitWithVisitor[]);
  }, [supabase]);

  useEffect(() => {
    fetchAllVisits().finally(() => setLoading(false));

    // ユニークなチャンネル名でReactのStrictMode二重実行を回避
    const channelName = `visits-realtime-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "visits" },
        async (payload) => {
          const visit = await fetchVisitById(payload.new.id as string);
          if (visit) setVisits((prev) => [...prev, visit]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "visits" },
        async (payload) => {
          const updated = await fetchVisitById(payload.new.id as string);
          if (updated) {
            setVisits((prev) =>
              prev.map((v) => (v.id === updated.id ? updated : v))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "visits" },
        (payload) => {
          setVisits((prev) =>
            prev.filter((v) => v.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllVisits, fetchVisitById, supabase]);

  const addVisit = useCallback(
    async (data: VisitInsert) => {
      const { error } = await supabase.from("visits").insert(data);
      if (error) toast.error("面会の追加に失敗しました");
    },
    [supabase]
  );

  const updateVisit = useCallback(
    async (id: string, data: VisitUpdate) => {
      const { error } = await supabase.from("visits").update(data).eq("id", id);
      if (error) toast.error("面会の更新に失敗しました");
    },
    [supabase]
  );

  const deleteVisit = useCallback(
    async (id: string) => {
      const prev = visits.find((v) => v.id === id);
      setVisits((list) => list.filter((v) => v.id !== id));
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) {
        if (prev) setVisits((list) => [...list, prev]);
        toast.error("面会の削除に失敗しました");
      }
    },
    [supabase, visits]
  );

  return { visits, loading, addVisit, updateVisit, deleteVisit };
}
