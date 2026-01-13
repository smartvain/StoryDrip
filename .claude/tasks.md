# StoryDrip - 改善タスク v2

> コードレビューで発見された改善点。優先度順に対応する。

---

## 高優先度（Critical）

### T101 AI応答のバリデーション追加
- **対象**: `src/lib/ai.ts:77`
- **問題**: `generateObject()`の結果を検証せずに使用
- **リスク**: OpenAIが不正なJSONを返した場合にクラッシュ
- **対応**:
  - `schema.ts`の`safeValidateAIStory()`を使用
  - 検証失敗時はnullを返してfallbackへ

**成果物**: AI応答が必ずZodで検証される

---

### T102 タイムゾーンの統一（JST）
- **対象**: `src/lib/hash.ts` と `src/lib/rateLimit.ts`
- **問題**: hash.tsはJST、rateLimit.tsはUTCを使用
- **リスク**: キャッシュミスやレート制限の誤動作
- **対応**:
  - 共通のJST時刻取得ユーティリティを作成
  - 両ファイルで統一的に使用

**成果物**: 全ファイルでJSTが一貫して使用される

---

### T103 APIとライブラリのコード重複解消
- **対象**: `src/app/api/story/route.ts` と `src/lib/getStory.ts`
- **問題**: ほぼ同一のストーリー生成ロジックが2箇所に存在
- **対応**:
  - `getStory.ts`に処理を集約
  - `route.ts`は`getStory()`を呼び出すだけにする

**成果物**: ストーリー生成ロジックが1箇所に集約

---

### T104 レート制限のKV障害時対応
- **対象**: `src/lib/rateLimit.ts:40-50`
- **問題**: KVエラー時に`allowed: true`を返してしまう
- **リスク**: DDoS攻撃のリスク
- **対応**:
  - 選択肢A: fail-closed（エラー時は拒否）
  - 選択肢B: インメモリフォールバック
  - 選択肢C: 短時間のみバイパスを許可（現状維持 + ログ強化）

**成果物**: KV障害時もセキュリティが維持される

---

### T105 環境変数のバリデーション
- **対象**: `src/lib/ai.ts:72`
- **問題**: `OPENAI_API_KEY`の存在確認なし
- **対応**:
  - 起動時に必須環境変数をチェック
  - 不足時は明確なエラーメッセージを表示

**成果物**: 環境変数不足時に早期エラー

---

## 中優先度

### T201 エラーハンドリングの統一
- **対象**: 複数ファイル（ai.ts, kv.ts, rateLimit.ts, getStory.ts）
- **問題**: `console.error`/`console.warn`/`console.log`が混在
- **対応**:
  - 統一的なログ関数を作成
  - 開発用`console.log`を削除（ai.ts:96）

---

### T202 Cookieの重複設定解消
- **対象**: `middleware.ts` + `route.ts`
- **問題**: 両方でCookieを設定しており意図不明
- **対応**:
  - middlewareに一本化するか、役割を明確化

---

### T203 AI生成リトライの改善
- **対象**: `src/lib/ai.ts:91-100`
- **問題**: 即座にリトライするためスロットリング時に効果なし
- **対応**:
  - 指数バックオフまたは待機時間を追加

---

### T204 アクセシビリティ（A11y）対応
- **対象**: `page.tsx`, `error.tsx`, `loading.tsx`
- **問題**: `aria-label`やスクリーンリーダー対応なし
- **対応**:
  - ジャンルバッジに`aria-label`追加
  - ローディング状態に`aria-live`追加
  - エラーボタンに`aria-label`追加

---

## 低優先度

### T301 未使用コードの削除
- **対象**: `src/lib/schema.ts:62-78`
- `validateAIStory()`と`safeValidateAIStory()`が未使用
- T101で使用するか、使わないなら削除

---

### T302 APIレスポンスにキャッシュヘッダー追加
- **対象**: `src/app/api/story/route.ts`
- `Cache-Control`ヘッダーを追加してCDNキャッシュを有効化

---

### T303 Loading画面のレイアウトシフト修正
- **対象**: `src/app/loading.tsx:39`
- `Math.random()`を固定値またはCSS animationに変更

---

### T304 Next.js設定の強化
- **対象**: `next.config.ts`
- セキュリティヘッダー、キャッシュ設定を追加

---

## 将来対応（テスト）

### T401 テストフレームワーク導入
- Jest または Vitest を導入
- 優先度順にテストを追加:
  1. ハッシュ関数の決定論的動作
  2. Zodスキーマ検証
  3. API統合テスト

---

## 進捗

| タスク | ステータス | 備考 |
|--------|------------|------|
| T101   | ✅ 完了    | `safeValidateAIStory()`を使用してAI応答を検証 |
| T102   | ✅ 完了    | `hash.ts`に`getJSTDate()`, `getMinuteBucket()`を追加、`rateLimit.ts`で使用 |
| T103   | ✅ 完了    | `generateStoryCore()`をコアロジックとして抽出、`route.ts`から呼び出し |
| T104   | ✅ 完了    | fail-closed方式に変更（KVエラー時はリクエスト拒否） |
| T105   | ✅ 完了    | `env.ts`を追加、`ai.ts`で環境変数チェック |
