"use client";

import { useState } from "react";

type StepResult = { label: string; ok: boolean; detail?: string };

export default function SetupPage() {
  const [pat, setPat] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    if (!pat.trim()) {
      setError("Personal Access Token を入力してください");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/db-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pat: pat.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
      } else {
        setResults(data.steps);
      }
    } catch {
      setLoading(false);
      setError("ネットワークエラーが発生しました");
    }
  };

  const allOk = results?.every((r) => r.ok) ?? false;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">データベースセットアップ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            留意事項・掲示板・画像アップロード機能に必要なDBを一括構築します。
          </p>
        </div>

        {!results && (
          <div className="space-y-4 border rounded-xl p-5 bg-card">
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">
                Supabase Personal Access Token（PAT）
              </label>
              <p className="text-xs text-muted-foreground">
                1.{" "}
                <a
                  href="https://supabase.com/dashboard/account/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  このリンク
                </a>
                を開く
                <br />
                2. 「Generate new token」→ 名前は何でもOK → 生成
                <br />
                3. 表示されたトークンをコピーして下に貼り付け
              </p>
              <input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetup()}
                placeholder="sbp_xxxxxxxxxxxxxxxx..."
                className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? "セットアップ中..." : "セットアップ実行"}
            </button>
          </div>
        )}

        {results && (
          <div className="border rounded-xl p-5 bg-card space-y-3">
            <p className="font-medium">
              {allOk ? "✅ セットアップ完了！" : "⚠️ 一部でエラーが発生しました"}
            </p>
            <ul className="space-y-1.5">
              {results.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0">{r.ok ? "✅" : "❌"}</span>
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
            {allOk ? (
              <a
                href="/"
                className="block mt-2 text-center bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium"
              >
                アプリに戻る →
              </a>
            ) : (
              <button
                onClick={() => setResults(null)}
                className="w-full border rounded-md py-2 text-sm"
              >
                やり直す
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
