import { kv } from "@vercel/kv";
import { getMinuteBucket } from "./hash";

const RATE_LIMIT_MAX = 6; // 1分あたりの最大リクエスト数
const RATE_LIMIT_TTL = 60; // TTL（秒）

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
  error?: boolean;
}

/**
 * レート制限をチェックし、カウントをインクリメント
 *
 * セキュリティ方針: fail-closed
 * KVエラー時はリクエストを拒否してDDoS攻撃を防ぐ
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
    console.error("Rate limit check error (fail-closed):", error);
    // KVエラー時はリクエストを拒否（セキュリティ優先）
    return {
      allowed: false,
      current: 0,
      limit: RATE_LIMIT_MAX,
      remaining: 0,
      error: true,
    };
  }
}
