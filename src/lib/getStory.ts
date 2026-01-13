import { cookies } from "next/headers";
import { getBucket } from "./hash";
import { generateStorySpec, selectGenre } from "./storySpec";
import { type Genre, genres } from "./pools";
import type { StoryResponse } from "./schema";
import { getCachedStory, setCachedStory } from "./kv";
import { generateStoryWithRetry, getFallbackStory } from "./ai";

const COOKIE_NAME = "vid";

/**
 * vidを取得（middlewareで必ず設定されている前提）
 */
async function getVid(): Promise<string> {
  const cookieStore = await cookies();
  const vid = cookieStore.get(COOKIE_NAME)?.value;
  // middlewareで設定されるはずなので、ない場合はエラー
  if (!vid) {
    throw new Error("vid cookie not found");
  }
  return vid;
}

/**
 * genreパラメータを検証
 */
function parseGenre(genreParam: string | null): Genre | null {
  if (!genreParam) return null;
  if (genres.includes(genreParam as Genre)) {
    return genreParam as Genre;
  }
  return null;
}

export interface GetStoryResult {
  story: StoryResponse;
  cacheHit: boolean;
  isFallback: boolean;
}

/**
 * ストーリー生成のコアロジック（APIとServer Component共通）
 */
export async function generateStoryCore(
  vid: string,
  bucket: string,
  genre: Genre
): Promise<GetStoryResult> {
  // 1. キャッシュチェック
  const cached = await getCachedStory(vid, bucket, genre);
  if (cached) {
    return {
      story: {
        ...cached,
        meta: {
          ...cached.meta,
          cacheHit: true,
        },
      },
      cacheHit: true,
      isFallback: false,
    };
  }

  // 2. キャッシュミス → storySpec生成
  const spec = generateStorySpec(vid, bucket, genre);

  // 3. AI生成（再試行あり）
  const aiStory = await generateStoryWithRetry(spec);
  const now = new Date().toISOString();

  let response: StoryResponse;
  let isFallback = false;

  if (aiStory) {
    response = {
      ...aiStory,
      seed: {
        setting: spec.setting,
        mysterySeed: spec.mysterySeed,
        constraint: spec.constraint,
        twist: spec.twist,
        hookItem: spec.hookItem,
      },
      meta: {
        vid,
        bucket,
        cacheHit: false,
        generatedAt: now,
      },
    };
  } else {
    console.error("AI generation failed, using fallback");
    const fallback = getFallbackStory(spec);
    response = {
      ...fallback,
      seed: {
        setting: spec.setting,
        mysterySeed: spec.mysterySeed,
        constraint: spec.constraint,
        twist: spec.twist,
        hookItem: spec.hookItem,
      },
      meta: {
        vid,
        bucket,
        cacheHit: false,
        generatedAt: now,
      },
    };
    isFallback = true;
  }

  // 4. キャッシュに保存
  await setCachedStory(vid, bucket, genre, response, isFallback);

  return {
    story: response,
    cacheHit: false,
    isFallback,
  };
}

/**
 * ストーリーを取得（Server Component用）
 */
export async function getStory(
  genreParam?: string | null
): Promise<GetStoryResult> {
  const vid = await getVid();
  const bucket = getBucket();
  const genre = parseGenre(genreParam ?? null) ?? selectGenre(vid, bucket);

  return generateStoryCore(vid, bucket, genre);
}
