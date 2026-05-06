"use client";

import { useState, useEffect, useRef } from "react";
import { useVisitors } from "@/hooks/useVisitors";
import { useVisitorImages } from "@/hooks/useVisitorImages";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  const [selectedId, setSelectedId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<VisitorImage[]>([]);
  const [allImages, setAllImages] = useState<Record<string, VisitorImage[]>>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAll = selectedId === "ALL";
  const selectedVisitor = visitors.find((v) => v.id === selectedId);

  // 最初の訪問者を自動選択
  useEffect(() => {
    if (!visitorsLoading && visitors.length > 0 && !selectedId) {
      setSelectedId(visitors[0].id);
    }
  }, [visitors, visitorsLoading, selectedId]);

  // 個別訪問者が変わったら留意事項と画像を読み込む
  useEffect(() => {
    if (isAll || !selectedVisitor) {
      setNotes("");
      setImages([]);
      return;
    }
    setNotes(selectedVisitor.notes ?? "");
    fetchImages(selectedVisitor.id).then(setImages);
  }, [selectedVisitor, isAll, fetchImages]);

  // 「全て」選択時に全訪問者の画像を一括取得
  useEffect(() => {
    if (!isAll || visitors.length === 0) return;
    setLoadingAll(true);
    Promise.all(
      visitors.map((v) =>
        fetchImages(v.id).then((imgs) => ({ id: v.id, imgs }))
      )
    ).then((results) => {
      const map: Record<string, VisitorImage[]> = {};
      results.forEach(({ id, imgs }) => {
        map[id] = imgs;
      });
      setAllImages(map);
      setLoadingAll(false);
    });
  }, [isAll, visitors, fetchImages]);

  const handleSaveNotes = async () => {
    if (!selectedId || isAll) return;
    setSaving(true);
    await updateVisitor(selectedId, { notes: notes || null });
    toast.success("留意事項を保存しました");
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId || isAll) return;
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
      {/* 画像ポップアップ */}
      <Dialog open={!!lightboxSrc} onOpenChange={() => setLightboxSrc(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95">
          {lightboxSrc && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lightboxSrc}
              alt="拡大表示"
              className="w-full h-auto max-h-[85dvh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 訪問者選択 */}
      <div className="space-y-1.5">
        <Label>訪問者</Label>
        <Select value={selectedId} onValueChange={(v) => { if (v) setSelectedId(v); }}>
          <SelectTrigger>
            <SelectValue>
              {isAll ? (
                <span className="font-medium">全て</span>
              ) : selectedVisitor ? (
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
            <SelectItem value="ALL">
              <span className="font-medium">全て</span>
            </SelectItem>
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

      {/* 全て表示 */}
      {isAll && (
        <>
          {loadingAll ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {visitors.map((v) => {
                const visitorImages = allImages[v.id] ?? [];
                const hasNotes = v.notes && v.notes.trim();
                const hasImages = visitorImages.length > 0;
                return (
                  <div key={v.id} className="border rounded-xl p-4 bg-card space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: v.color }}
                      />
                      <span className="font-semibold text-sm">{v.name}</span>
                    </div>
                    {!hasNotes && !hasImages && (
                      <p className="text-xs text-muted-foreground">登録なし</p>
                    )}
                    {hasNotes && (
                      <p className="text-sm whitespace-pre-wrap text-foreground/80 bg-muted/40 rounded-lg p-3 leading-relaxed">
                        {v.notes}
                      </p>
                    )}
                    {hasImages && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {visitorImages.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setLightboxSrc(getImageUrl(img.storage_path))}
                            className="aspect-square overflow-hidden rounded-lg border bg-muted hover:opacity-80 transition-opacity"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getImageUrl(img.storage_path)}
                              alt={img.filename}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 個別訪問者の編集 */}
      {selectedVisitor && !isAll && (
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
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(getImageUrl(img.storage_path))}
                      className="block w-full aspect-square overflow-hidden rounded-lg border bg-muted hover:opacity-80 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(img.storage_path)}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-md p-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
