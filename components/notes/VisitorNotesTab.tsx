"use client";

import { useState, useEffect, useRef } from "react";
import { useVisitors } from "@/hooks/useVisitors";
import { useVisitorImages } from "@/hooks/useVisitorImages";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { VisitorImage } from "@/types";

export function VisitorNotesTab() {
  const { visitors, loading: visitorsLoading, updateVisitor } = useVisitors();
  const { fetchImages, getImageUrl, uploadImage, deleteImage } = useVisitorImages();

  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<VisitorImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedVisitor = visitors.find((v) => v.id === selectedId);

  // 最初の訪問者を自動選択
  useEffect(() => {
    if (!visitorsLoading && visitors.length > 0 && !selectedId) {
      setSelectedId(visitors[0].id);
    }
  }, [visitors, visitorsLoading, selectedId]);

  // 訪問者が変わったら留意事項と画像を読み込む
  useEffect(() => {
    if (!selectedVisitor) {
      setNotes("");
      setImages([]);
      return;
    }
    setNotes(selectedVisitor.notes ?? "");
    fetchImages(selectedVisitor.id).then(setImages);
  }, [selectedVisitor, fetchImages]);

  const handleSaveNotes = async () => {
    if (!selectedId) return;
    setSaving(true);
    await updateVisitor(selectedId, { notes: notes || null });
    toast.success("留意事項を保存しました");
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("5MB以下の画像を選択してください");
      return;
    }
    setUploading(true);
    const image = await uploadImage(selectedId, file);
    if (image) {
      setImages((prev) => [image, ...prev]);
      toast.success("画像をアップロードしました");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteImage = async (image: VisitorImage) => {
    await deleteImage(image);
    setImages((prev) => prev.filter((i) => i.id !== image.id));
    toast.success("画像を削除しました");
  };

  if (visitorsLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (visitors.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        訪問者が登録されていません
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* 訪問者選択 */}
      <div className="space-y-1.5">
        <Label>訪問者</Label>
        <Select value={selectedId} onValueChange={(v) => { if (v) setSelectedId(v); }}>
          <SelectTrigger>
            <SelectValue>
              {selectedVisitor ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
                    style={{ backgroundColor: selectedVisitor.color }}
                  />
                  {selectedVisitor.name}
                </span>
              ) : (
                <span className="text-muted-foreground">訪問者を選択</span>
              )}
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
          </SelectContent>
        </Select>
      </div>

      {selectedVisitor && (
        <>
          {/* 留意事項テキスト */}
          <div className="space-y-1.5">
            <Label>留意事項・コメント</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="アレルギー、持病、面会時の注意点など..."
              rows={5}
              className="resize-none"
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={saving}
              className="w-full"
            >
              {saving ? "保存中..." : "留意事項を保存"}
            </Button>
          </div>

          {/* 画像アップロード */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>画像</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading ? "アップロード中..." : "画像を追加"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground text-sm">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                画像がありません
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(img.storage_path)}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="削除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-muted-foreground truncate mt-1 px-0.5">
                      {img.filename}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
