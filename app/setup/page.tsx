"use client";

import { useState } from "react";

type StepResult = { label: string; ok: boolean; detail?: string };

export default function SetupPage() {
  const [pat, setPat] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    if (!pat.trim() || !serviceKey.trim()) {
      setError("両方のキーを入力してください");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);

    const res = await fetch("/api/db-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pat: pat.trim(), serviceKey: serviceKey.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
    } else {
      setResults(data.steps);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">データベースセットアップ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            新機能（留意事項・掲示板）に必要なテーブルとStorageを作成します。
          </p>
        </div>

        <div className="space-y-4 border rounded-xl p-5 bg-card">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Supabase Personal Access Token（PAT）
            </label>
            <p className="text-xs text-muted-foreground">
              取得先:{" "}
              <a
                href="https://supabase.com/dashboard/account/tokens"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                supabase.com/dashboard/account/tokens
              </a>
              　→ 「Generate new token」
            </p>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Supabase Service Role Key
            </label>
            <p className="text-xs text-muted-foreground">
              取得先: Supabase Dashboard →{" "}
              <strong>Settings → API → service_role</strong>（「Reveal」を押す）
            </p>
            <input
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "セットアップ中..." : "セットアップ実行"}
          </button>
        </div>

        {results && (
          <div className="border rounded-xl p-5 bg-card space-y-2">
            <p className="text-sm font-medium">
              {results.every((r) => r.ok) ? "✅ セットアップ完了！" : "⚠️ 一部エラーがあります"}
            </p>
            <ul className="space-y-1.5">
              {results.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span>{r.ok ? "✅" : "❌"}</span>
                  <span>
                    {r.label}
                    {r.detail && (
                      <span className="block text-xs text-muted-foreground mt-0.5 font-mono break-all">
                        {r.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {results.every((r) => r.ok) && (
              <a
                href="/"
                className="block mt-3 text-center bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium"
              >
                アプリに戻る
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
