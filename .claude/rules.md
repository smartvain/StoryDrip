# StoryDrip - 開発ルール

## コーディング規約

### TypeScript
- `strict: true` を維持
- `any`の使用禁止（`unknown`を使用）
- 全ての関数に戻り値の型を明示

### エラーハンドリング
- AIやKVの外部サービス呼び出しは必ずtry-catchで囲む
- エラーログは`console.error`で統一（`console.log`や`console.warn`は使用しない）
- ユーザー向けエラーは日本語で表示

### タイムゾーン
- **全ての日時処理はJST（Asia/Tokyo）で統一**
- `src/lib/hash.ts`の`getJSTDate()`を使用
- UTCを直接使用しない

### バリデーション
- 外部からのデータ（AI応答、APIパラメータ）は必ずZodで検証
- 内部データ（pools.ts等）はTypeScriptの型で保証

### キャッシュ
- KVキー形式: `{prefix}:{vid}:{bucket}:{genre}`
- 正常ストーリーTTL: 610秒
- フォールバックTTL: 60秒
- レート制限TTL: 60秒

### セキュリティ
- Cookie: `httpOnly: true`, `secure: true`（本番）, `sameSite: "lax"`
- 環境変数は起動時に検証
- レート制限は常に有効（KV障害時もフォールバックで維持）

## ファイル構成

```
src/
├── app/
│   ├── api/story/route.ts  # APIルート（薄く保つ）
│   ├── page.tsx            # メインページ
│   ├── layout.tsx          # レイアウト
│   ├── loading.tsx         # ローディングUI
│   ├── error.tsx           # エラーUI
│   └── globals.css         # グローバルスタイル
├── lib/
│   ├── ai.ts               # AI生成ロジック
│   ├── getStory.ts         # ストーリー取得（コア）
│   ├── kv.ts               # KVキャッシュ
│   ├── rateLimit.ts        # レート制限
│   ├── schema.ts           # Zodスキーマ
│   ├── storySpec.ts        # 仕様生成
│   ├── hash.ts             # ハッシュユーティリティ
│   └── pools.ts            # データプール
└── middleware.ts           # Cookie処理
```

## 変更時のチェックリスト

### AI関連を変更する場合
- [ ] Zodスキーマと整合性があるか
- [ ] リトライロジックは適切か
- [ ] フォールバックは動作するか

### キャッシュ関連を変更する場合
- [ ] キー形式は仕様通りか
- [ ] TTLは適切か
- [ ] 同一入力で同一出力になるか（決定論的か）

### 時刻関連を変更する場合
- [ ] JSTで処理しているか
- [ ] 10分バケットの境界は正しいか

## 禁止事項

- `console.log`を本番コードに残さない
- 環境変数を検証なしで使用しない
- AI応答をZod検証なしで使用しない
- タイムゾーンをファイルごとにバラバラにしない
- ストーリー生成ロジックを複数箇所に分散させない
