import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getBucket } from "./hash";
import { generateStorySpec, selectGenre } from "./storySpec";
import { type Genre, genres } from "./pools";
import type { StoryResponse } from "./schema";
import { getCachedStory, setCachedStory } from "./kv";
import { generateStoryWithRetry, getFallbackStory } from "./ai";

const COOKIE_NAME = "vid";

/**
 * vidを取得または生成（Server Component用）
 */
async function getOrCreateVid(): Promise<{ vid: string; isNew: boolean }> {
  const cookieStore = await cookies();
  const existingVid = cookieStore.get(COOKIE_NAME)?.value;

  if (existingVid) {
    return { vid: existingVid, isNew: false };
  }

  return { vid: uuidv4(), isNew: true };
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
  newVid: string | null; // 新規発行されたvidがあれば
}

/**
 * ストーリーを取得（Server Component用）
 */
export async function getStory(
  genreParam?: string | null
): Promise<GetStoryResult> {
  // 1. vid取得/生成
  const { vid, isNew } = await getOrCreateVid();

  // 2. bucket算出（JST 10分単位）
  const bucket = getBucket();

  // 3. genre決定（クエリ優先、なければハッシュで選択）
  const genre = parseGenre(genreParam ?? null) ?? selectGenre(vid, bucket);

  // 4. キャッシュチェック
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
      newVid: isNew ? vid : null,
    };
  }

  // 5. キャッシュミス → storySpec生成
  const spec = generateStorySpec(vid, bucket, genre);

  // 6. AI生成（再試行あり）
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
    console.warn("AI generation failed, using fallback");
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

  // 7. キャッシュに保存
  await setCachedStory(vid, bucket, genre, response, isFallback);

  return {
    story: response,
    newVid: isNew ? vid : null,
  };
}
