# Today’s Story（今日のストーリー） - Spec v1

## 1. 概要

訪問するたびに AI が短いストーリーを生成して表示する Web アプリ。
ただし「毎回生成」だとコストが爆発しやすいので、ユーザー（cookie）単位で **10 分間は同じ結果** を返す（短期キャッシュ）。
Next.js（App Router）で SSR し、サーバーレス環境で動作する。

本アプリの強みは「生成結果そのもの」。永続 DB は持たず、Vercel KV（Redis）を短期キャッシュ用途に使う。

## 2. ユーザー体験（UX）

### 2.1 生成タイミング

- トップページ表示時に自動生成（SSR で描画時に取得）
- 10 分ごとに新作へ切り替わる（ユーザー単位）

### 2.2 表示形式（固定フォーマット）

- タイトル（短め）
- ジャンルバッジ（感動 / 不思議 / コメディ）
- 7 つのシーン（各 1 文、映像が浮かぶ）
- 余韻（1 文）
- 引き（1 文：続きが気になるが恐怖に寄せない）

※セリフ（「」）は禁止。字幕っぽい説明も避け、映像優先で短文。

## 3. コンテンツ仕様

### 3.1 ジャンル

- 3 択：`kando`（感動） / `mystery`（不思議） / `comedy`（コメディ）

### 3.2 登場人物（固定ルール）

- 必ず「動物 × 人間の相棒」
- 動物・人間の職業/役割はランダム

### 3.3 安全制約（必須）

- 残酷/暴力/性的/差別の表現禁止
- 実在人物・実在事件・固有ブランド名（企業/商品/サービス名）を出さない
- 違法行為の指南、医療アドバイス、扇動はしない

### 3.4 “続きが気になる”引き（必須）

引きは、次のいずれかを必ず含む：

- 未回収の手がかり（物・刻印・番号・音など）
- 次の行動の予告（走り出す/振り返る/扉が開く など）
- 静かな異変（灯り/時計/標識/合図など）

ただし「ホラー・グロ」方向の恐怖煽りはしない。

## 4. 10 分キャッシュ仕様（cookie 単位）

### 4.1 Cookie

- cookie 名：`vid`
- 値：UUID v4
- 属性：HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=31536000（1 年）

### 4.2 10 分バケット（JST）

- JST（Asia/Tokyo）で現在時刻を取得
- 分を 10 分単位で切り捨て（00/10/20/30/40/50）
- `bucket` 形式：`YYYYMMDDHHmm`（例：2026/01/12 23:17 → 202601122310）

### 4.3 キャッシュキー & TTL

- Key：`story:{vid}:{bucket}:{genre}`
- TTL：610 秒（10 分 + バッファ）

同一ユーザー（vid）× 同一バケット × 同一ジャンルは常に同じ結果を返す。

## 5. ランダム化（ブレないランダム）

「全部ランダム」ではなく、**パラメータを決めてから生成**する。

### 5.1 storySpec（入力パラメータ）

- genre
- setting（舞台）
- animal（動物）
- human（相棒の役割/職業）
- mysterySeed（謎の種）
- constraint（制限）
- twist（反転）
- hookItem（引きの鍵）

### 5.2 決定論的（deterministic）に選ぶ

`vid + bucket + genre + fieldName` を元にハッシュし、各プールから index を選ぶ。
→ 10 分間は storySpec が固定され、AI 再試行してもブレにくい。

## 6. API 仕様

### 6.1 GET /api/story

- クエリ：`genre`（任意）= `kando|mystery|comedy`
  - 未指定なら deterministic に選択（hash(vid+bucket)%3）
- 処理：
  1. cookie `vid` を読む/なければ発行
  2. JST bucket 算出
  3. genre 決定
  4. KV で `story:{vid}:{bucket}:{genre}` を get
  5. hit → そのまま返す
  6. miss → storySpec 生成 → AI 生成 → 検証 → KV setex → 返す

### 6.2 レスポンス JSON（正）

- title: string
- genre: "kando"|"mystery"|"comedy"
- duo: { animal: string, human: string }
- scenes: string[7]
- afterglow: string
- cliffhanger: string
- seed: { setting, mysterySeed, constraint, twist, hookItem }
- meta:
  - vid: string
  - bucket: string
  - cacheHit: boolean
  - generatedAt: ISO string

### 6.3 失敗時フォールバック

- AI 失敗、JSON パース失敗、schema 不一致の場合：
  - テンプレートで安全なストーリーを生成して返す
  - fallback も短 TTL（例：60 秒）で KV に入れてスパイクを抑える

## 7. レート制限（推奨）

- `vid` 単位で 1 分あたり最大 6 リクエスト
- KV カウンタ（INCR + TTL 60 秒）
- 超過は 429

## 8. 画面仕様（/）

- SSR で /api/story を呼んで描画
- 表示項目：
  - タイトル
  - ジャンルラベル（日本語）
  - 7 シーン（箇条書き）
  - 余韻、引き（強調して表示）
  - 「10 分ごとに更新」注記
- 生成中の体験：
  - MVP ではスケルトン or “生成中…” 表示
  - ストリーミング対応は v2 で検討（本 spec 外）

## 9. 非目標（v1 ではやらない）

- ユーザー登録・ログイン
- 生成履歴の保存（DB）
- いいね/シェア数などの永続集計
- 管理画面
