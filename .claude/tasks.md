# Today’s Story - Tasks v1

> 仕様書駆動開発の前提：まず spec.md / tasks.md をレビューして「何を作るか」を合意し、その後に実装する。 :contentReference[oaicite:1]{index=1}  
> 並列実行可能なタスクには [P] を付ける。 :contentReference[oaicite:2]{index=2}

---

## T001 [P] リポジトリ/プロジェクト初期化

- Next.js（App Router）プロジェクト作成
- TypeScript 有効
- ESLint/Prettier（任意）
- ルート：`/` と `/api/story`

**成果物**

- 起動できる雛形（トップが表示される）

---

## T002 [P] Vercel KV セットアップ手順の整備（ドキュメント）

- Vercel Dashboard → Storage → KV 作成手順を README に追記
- ローカル開発用 `.env.local` の例を用意
- 依存パッケージ：`@vercel/kv`

**成果物**

- KV が無いときに何が起きるか（エラー）/ どう設定するかが明確

---

## T003 [P] storySpec の決定論的生成（seeded selection）

- `pools.ts`：各プール（setting/animal/human/...）を定義
- `hash.ts`：sha256→int のユーティリティ
- `storySpec.ts`：
  - 入力：`vid`, `bucket`, `genre`
  - 出力：`storySpec`
  - すべて deterministic（同入力なら同出力）

**成果物**

- 単体テスト（任意）：同じ入力で同じ storySpec になる

---

## T004 [P] Zod schema（AI レスポンスの厳格検証）

- `schema.ts`：
  - StoryResponse の Zod schema
  - `scenes` は length=7 を保証
  - `genre` は union
  - `safety` が false であることを確認（必要なら refine）

**成果物**

- パース/検証が 1 関数で完結する

---

## T005 /api/story ルート実装（cookie・bucket・genre）

**依存**: T003, T004

- cookie `vid` を読む/無ければ発行
- JST bucket を算出
- genre を決定（query 優先 / なければ hash(vid+bucket)%3）
- `meta` を構築するための基本情報を準備

**成果物**

- まだ AI/KV 無しでも、固定 JSON を返せる状態

---

## T006 Vercel KV キャッシュ実装（get/setex）

**依存**: T005

- key: `story:{vid}:{bucket}:{genre}`
- hit → cached story を返却（cacheHit=true）
- miss → 次タスク（AI 生成）へ

**成果物**

- KV に保存した JSON を正しく返せる

---

## T007 レート制限（KV INCR + TTL 60 秒）

**依存**: T005

- key: `rl:{vid}:{minuteBucket}`
- 60 秒 TTL
- 6 回超えたら 429

**成果物**

- スパム/連打で AI が叩かれ続けない

---

## T008 AI 生成（server-side） + JSON only prompt

**依存**: T005, T003, T004

- `storySpec` をプロンプトへ埋め込む
- 出力は JSON only を強制
- 1 回目が壊れてたら **1 回だけ再試行**（より強く JSON のみを要求）
- 最終的に Zod で検証
- 失敗したら fallback テンプレへ

**成果物**

- 正常系で StoryResponse を返せる

---

## T009 miss 時フロー統合（AI→KV 保存 → 返却）

**依存**: T006, T008

- miss → AI 生成 → validate → KV setex(610s) → return
- fallback も短 TTL（60s）で保存（リトライ嵐回避）

**成果物**

- /api/story が仕様通りに完成

---

## T010 / ページ SSR 実装

**依存**: T009

- `app/page.tsx`（Server Component）で `/api/story` を SSR fetch
- 表示：
  - title
  - genre label（感動/不思議/コメディ）
  - scenes 7 行
  - afterglow
  - cliffhanger
  - 「10 分ごとに更新」注記

**成果物**

- 画面でストーリーが表示される

---

## T011 表示の整形（最低限の UI）

**依存**: T010

- 見出し/余白/箇条書き/強調
- エラー時の表示（429/500）

**成果物**

- MVP として十分読みやすい

---

## T012 動作確認シナリオ（手動テスト）

**依存**: T010

- 同一ブラウザで 10 分以内 → 同じ結果（cacheHit true）
- 10 分後 → 変化
- genre 指定 → genre 別に固定される
- レート制限超過 → 429
- KV 無効/AI 失敗 → fallback が表示される

**成果物**

- 受け入れ条件を満たすことを確認

---

## T013（任意 / v2）ストリーミング対応

- 体験向上。今回は v1 スコープ外。
