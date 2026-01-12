import { kv } from "@vercel/kv";
import type { StoryResponse } from "./schema";
import type { Genre } from "./pools";

const STORY_TTL = 610; // 10分 + バッファ（秒）
const FALLBACK_TTL = 60; // フォールバック用の短いTTL（秒）

/**
 * ストーリーキャッシュのキーを生成
 */
export function getStoryCacheKey(
  vid: string,
  bucket: string,
  genre: Genre
): string {
  return `story:${vid}:${bucket}:${genre}`;
}

/**
 * キャッシュからストーリーを取得
 */
export async function getCachedStory(
  vid: string,
  bucket: string,
  genre: Genre
): Promise<StoryResponse | null> {
  try {
    const key = getStoryCacheKey(vid, bucket, genre);
    const cached = await kv.get<StoryResponse>(key);
    return cached;
  } catch (error) {
    console.error("KV get error:", error);
    return null;
  }
}

/**
 * ストーリーをキャッシュに保存
 */
export async function setCachedStory(
  vid: string,
  bucket: string,
  genre: Genre,
  story: StoryResponse,
  isFallback: boolean = false
): Promise<void> {
  try {
    const key = getStoryCacheKey(vid, bucket, genre);
    const ttl = isFallback ? FALLBACK_TTL : STORY_TTL;
    await kv.setex(key, ttl, story);
  } catch (error) {
    console.error("KV set error:", error);
    // キャッシュ保存の失敗は致命的ではないので続行
  }
}

/**
 * KVが利用可能かチェック
 */
export async function isKVAvailable(): Promise<boolean> {
  try {
    await kv.ping();
    return true;
  } catch {
    return false;
  }
}
