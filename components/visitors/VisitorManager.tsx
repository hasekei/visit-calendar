"use client";

import { useState } from "react";
import { useVisitors } from "@/hooks/useVisitors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VISITOR_COLORS } from "@/lib/utils";
import { Trash2, Check } from "lucide-react";

export function VisitorManager() {
  const { visitors, addVisitor, deleteVisitor, updateVisitor } = useVisitors();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(VISITOR_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await addVisitor({ name, color: newColor, sort_order: visitors.length });
    setNewName("");
    setNewColor(VISITOR_COLORS[0]);
  };

  const handleEditSave = async (id: string) => {
    const name = editName.trim();
    if (name) await updateVisitor(id, { name });
    setEditingId(null);
  };

  return (
    <div className="space-y-3 p-1">
      <p className="text-sm font-medium text-muted-foreground">訪問者を管理</p>

      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {visitors.map((v) => (
          <li key={v.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: v.color }}
            />
            {editingId === v.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave(v.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleEditSave(v.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <span
                  className="text-sm flex-1 cursor-pointer hover:text-primary truncate"
                  onClick={() => {
                    setEditingId(v.id);
                    setEditName(v.name);
                  }}
                >
                  {v.name}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteVisitor(v.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </li>
        ))}
        {visitors.length === 0 && (
          <li className="text-sm text-muted-foreground text-center py-2">
            訪問者がいません
          </li>
        )}
      </ul>

      <div className="border-t pt-3 space-y-2">
        <p className="text-xs text-muted-foreground">新しい訪問者を追加</p>
        <Input
          placeholder="名前"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="h-8 text-sm"
        />
        <div className="flex gap-1.5 flex-wrap">
          {VISITOR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: newColor === color ? "#000" : "transparent",
              }}
              onClick={() => setNewColor(color)}
            />
          ))}
        </div>
        <Button
          size="sm"
          className="w-full h-8"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          追加
        </Button>
      </div>
    </div>
  );
}
