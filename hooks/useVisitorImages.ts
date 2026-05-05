"use client";

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VisitorImage } from "@/types";
import { toast } from "sonner";

export function useVisitorImages() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchImages = useCallback(
    async (visitorId: string): Promise<VisitorImage[]> => {
      const { data, error } = await supabase
        .from("visitor_images")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data as VisitorImage[];
    },
    [supabase]
  );

  const getImageUrl = useCallback(
    (storagePath: string): string => {
      const { data } = supabase.storage
        .from("visitor-images")
        .getPublicUrl(storagePath);
      return data.publicUrl;
    },
    [supabase]
  );

  const uploadImage = useCallback(
    async (visitorId: string, file: File): Promise<VisitorImage | null> => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${visitorId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("visitor-images")
        .upload(path, file);

      if (uploadError) {
        toast.error("画像のアップロードに失敗しました");
        return null;
      }

      const { data, error } = await supabase
        .from("visitor_images")
        .insert({ visitor_id: visitorId, storage_path: path, filename: file.name })
        .select()
        .single();

      if (error) {
        toast.error("画像情報の保存に失敗しました");
        return null;
      }

      return data as VisitorImage;
    },
    [supabase]
  );

  const deleteImage = useCallback(
    async (image: VisitorImage) => {
      await supabase.storage.from("visitor-images").remove([image.storage_path]);
      const { error } = await supabase
        .from("visitor_images")
        .delete()
        .eq("id", image.id);
      if (error) toast.error("画像の削除に失敗しました");
    },
    [supabase]
  );

  return { fetchImages, getImageUrl, uploadImage, deleteImage };
}
