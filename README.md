# Today's Story (StoryDrip)

AIが10分ごとに短いストーリーを生成するWebアプリ。

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成：

```bash
cp .env.local.example .env.local
```

必要な環境変数：

```env
# Vercel KV (Redis)
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
```

### 3. Vercel KV のセットアップ

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択（または新規作成）
3. **Storage** タブを開く
4. **Create Database** → **KV** を選択
5. データベース名を入力して作成
6. **Connect to Project** でプロジェクトと紐付け
7. **.env.local** タブから環境変数をコピー

ローカル開発では Vercel CLI でも環境変数を取得可能：

```bash
vercel env pull .env.local
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

## 本番デプロイ

```bash
vercel
```

または GitHub リポジトリと連携して自動デプロイ。

## 注意事項

- **KV が未設定の場合**: キャッシュとレート制限が無効になります（AI生成は毎回実行）
- **OpenAI API Key が未設定の場合**: フォールバックのテンプレートストーリーが表示されます

## 技術スタック

- Next.js 16 (App Router)
- Vercel KV (Redis)
- Vercel AI SDK + OpenAI
- Tailwind CSS
- TypeScript
