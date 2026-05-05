/**
 * Supabase セットアップスクリプト
 * 実行方法: node scripts/setup-supabase.mjs
 *
 * 事前準備:
 *   SUPABASE_SERVICE_ROLE_KEY 環境変数にサービスロールキーを設定してください
 *   例(PowerShell): $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   例(bash):       export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 */

const SUPABASE_URL = "https://qceokprcnnizjzvqxdwa.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY 環境変数が設定されていません");
  console.error("   Supabase Dashboard > Settings > API > service_role キーを設定してください");
  process.exit(1);
}

const headers = {
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function runSQL(sql, description) {
  console.log(`\n📋 ${description}...`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    // exec_sql RPC がない場合は pg クエリ API を試す
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: sql }),
    });
    if (!res2.ok) {
      const text = await res2.text();
      console.warn(`  ⚠️  スキップ or 既存: ${text.slice(0, 100)}`);
      return false;
    }
  }
  console.log(`  ✅ 完了`);
  return true;
}

async function createBucket() {
  console.log("\n📋 Storage バケット 'visitor-images' を作成中...");
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: "visitor-images",
      name: "visitor-images",
      public: true,
    }),
  });
  const data = await res.json();
  if (!res.ok && !JSON.stringify(data).includes("already")) {
    console.warn("  ⚠️ バケット作成:", JSON.stringify(data));
  } else {
    console.log("  ✅ バケット作成完了（または既存）");
  }
}

async function main() {
  console.log("🚀 Supabase セットアップを開始します...");

  const sqls = [
    [
      `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS notes TEXT;`,
      "visitors テーブルに notes カラムを追加",
    ],
    [
      `CREATE TABLE IF NOT EXISTS visitor_images (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id   UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
        storage_path TEXT NOT NULL,
        filename     TEXT NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      "visitor_images テーブルを作成",
    ],
    [
      `ALTER TABLE visitor_images ENABLE ROW LEVEL SECURITY;`,
      "visitor_images RLS を有効化",
    ],
    [
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'visitor_images' AND policyname = 'public_all'
        ) THEN
          CREATE POLICY "public_all" ON visitor_images FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;`,
      "visitor_images ポリシーを作成",
    ],
    [
      `CREATE TABLE IF NOT EXISTS comments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username   TEXT NOT NULL,
        message    TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      "comments テーブルを作成",
    ],
    [
      `ALTER TABLE comments ENABLE ROW LEVEL SECURITY;`,
      "comments RLS を有効化",
    ],
    [
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'public_all'
        ) THEN
          CREATE POLICY "public_all" ON comments FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;`,
      "comments ポリシーを作成",
    ],
    [
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE comments;
        END IF;
      END $$;`,
      "comments を Realtime に追加",
    ],
  ];

  for (const [sql, desc] of sqls) {
    await runSQL(sql, desc);
  }

  await createBucket();

  console.log("\n✨ セットアップ完了！アプリを開いてご確認ください。");
  console.log("   https://visit-calendar-omega.vercel.app");
}

main().catch(console.error);
