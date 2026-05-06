"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { VisitorManager } from "./VisitorManager";
import { useVisitors } from "@/hooks/useVisitors";
import { PlusCircle } from "lucide-react";

interface VisitorSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  fallbackVisitor?: { name: string; color: string };
}

export function VisitorSelect({ value, onChange, error, fallbackVisitor }: VisitorSelectProps) {
  const { visitors } = useVisitors();
  const [managerOpen, setManagerOpen] = useState(false);

  const found = value ? visitors.find((v) => v.id === value) : null;
  const displayVisitor = found ?? (value && fallbackVisitor ? fallbackVisitor : null);

  return (
    <div className="space-y-1">
      <Select
        value={value || null}
        onValueChange={(v) => {
          if (v !== null) onChange(v);
        }}
      >
        <SelectTrigger
          className={`w-full ${error ? "border-destructive" : ""}`}
        >
          <SelectValue placeholder="訪問者を選択">
            {displayVisitor ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: displayVisitor.color }}
                />
                {displayVisitor.name}
              </span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {visitors.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
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

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Popover open={managerOpen} onOpenChange={setManagerOpen}>
        <PopoverTrigger
          className="inline-flex items-center gap-1 px-2 h-7 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          訪問者を管理
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <VisitorManager />
        </PopoverContent>
      </Popover>
    </div>
  );
}
