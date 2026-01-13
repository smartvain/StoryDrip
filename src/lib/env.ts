/**
 * 環境変数の検証
 *
 * このモジュールをインポートすると、必須の環境変数が存在するか確認される。
 * 不足している場合は明確なエラーメッセージと共に例外をスローする。
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `環境変数 ${key} が設定されていません。.env.local ファイルを確認してください。`
    );
  }
  return value;
}

// 必須環境変数（遅延評価で初回アクセス時にチェック）
let _openaiApiKey: string | null = null;

export function getOpenAIApiKey(): string {
  if (_openaiApiKey === null) {
    _openaiApiKey = getRequiredEnv("OPENAI_API_KEY");
  }
  return _openaiApiKey;
}

// KV関連の環境変数（Vercel KVは自動設定されるため任意）
export function getKVUrl(): string | undefined {
  return process.env.KV_REST_API_URL;
}

export function getKVToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN;
}

/**
 * 起動時に全ての必須環境変数をチェック
 * （オプション: 早期検出用）
 */
export function validateAllEnvVars(): void {
  getOpenAIApiKey();
}
