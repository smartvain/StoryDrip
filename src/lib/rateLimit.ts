import { kv } from "@vercel/kv";

const RATE_LIMIT_MAX = 6; // 1分あたりの最大リクエスト数
const RATE_LIMIT_TTL = 60; // TTL（秒）

/**
 * 分単位のバケットを取得
 */
function getMinuteBucket(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}`;
}

/**
 * レート制限キーを生成
 */
function getRateLimitKey(vid: string): string {
  const minuteBucket = getMinuteBucket();
  return `rl:${vid}:${minuteBucket}`;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}

/**
 * レート制限をチェックし、カウントをインクリメント
 */
export async function checkRateLimit(vid: string): Promise<RateLimitResult> {
  try {
    const key = getRateLimitKey(vid);

    // INCRでカウントアップ（キーが存在しない場合は1から開始）
    const current = await kv.incr(key);

    // 初回の場合はTTLを設定
    if (current === 1) {
      await kv.expire(key, RATE_LIMIT_TTL);
    }

    const allowed = current <= RATE_LIMIT_MAX;
    const remaining = Math.max(0, RATE_LIMIT_MAX - current);

    return {
      allowed,
      current,
      limit: RATE_LIMIT_MAX,
      remaining,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // KVエラー時はレート制限をバイパス（可用性優先）
    return {
      allowed: true,
      current: 0,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX,
    };
  }
}
