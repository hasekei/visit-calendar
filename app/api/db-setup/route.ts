import { NextRequest, NextResponse } from "next/server";

const PROJECT_REF = "qceokprcnnizjzvqxdwa";
const SUPABASE_URL = "https://qceokprcnnizjzvqxdwa.supabase.co";

async function runSQL(pat: string, query: string) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

async function createStorageBucket(serviceKey: string) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "visitor-images",
      name: "visitor-images",
      public: true,
    }),
  });
  const data = await res.json();
  return { ok: res.ok || JSON.stringify(data).includes("already"), data };
}

async function createStoragePolicy(serviceKey: string, sql: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  return { ok: res.ok };
}

export async function POST(req: NextRequest) {
  const { pat, serviceKey } = await req.json();

  if (!pat || !serviceKey) {
    return NextResponse.json(
      { error: "PAT と サービスロールキーの両方が必要です" },
      { status: 400 }
    );
  }

  const steps: { label: string; ok: boolean; detail?: string }[] = [];

  const sqlSteps = [
    {
      label: "visitors.notes カラム追加",
      sql: "ALTER TABLE visitors ADD COLUMN IF NOT EXISTS notes TEXT;",
    },
    {
      label: "visitor_images テーブル作成",
      sql: `CREATE TABLE IF NOT EXISTS visitor_images (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id   UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
        storage_path TEXT NOT NULL,
        filename     TEXT NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
    },
    {
      label: "visitor_images RLS 有効化",
      sql: "ALTER TABLE visitor_images ENABLE ROW LEVEL SECURITY;",
    },
    {
      label: "visitor_images ポリシー作成",
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='visitor_images' AND policyname='public_all') THEN
          CREATE POLICY "public_all" ON visitor_images FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;`,
    },
    {
      label: "comments テーブル作成",
      sql: `CREATE TABLE IF NOT EXISTS comments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username   TEXT NOT NULL,
        message    TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
    },
    {
      label: "comments RLS 有効化",
      sql: "ALTER TABLE comments ENABLE ROW LEVEL SECURITY;",
    },
    {
      label: "comments ポリシー作成",
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='public_all') THEN
          CREATE POLICY "public_all" ON comments FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;`,
    },
    {
      label: "comments Realtime 追加",
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='comments') THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE comments;
        END IF;
      END $$;`,
    },
  ];

  for (const step of sqlSteps) {
    const result = await runSQL(pat, step.sql);
    steps.push({
      label: step.label,
      ok: result.ok,
      detail: result.ok ? undefined : JSON.stringify(result.data).slice(0, 120),
    });
  }

  const bucketResult = await createStorageBucket(serviceKey);
  steps.push({
    label: "Storage バケット作成 (visitor-images)",
    ok: bucketResult.ok,
    detail: bucketResult.ok ? undefined : JSON.stringify(bucketResult.data).slice(0, 120),
  });

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json({ ok: allOk, steps });
}
