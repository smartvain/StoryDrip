import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getBucket } from "@/lib/hash";
import { generateStorySpec, selectGenre } from "@/lib/storySpec";
import { type Genre, genres } from "@/lib/pools";
import type { StoryResponse } from "@/lib/schema";
import { getCachedStory, setCachedStory } from "@/lib/kv";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateStoryWithRetry, getFallbackStory } from "@/lib/ai";

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE = 31536000; // 1年

/**
 * vidを取得または生成
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

/**
 * cookieをレスポンスにセット
 */
function setCookieOnResponse(
  res: NextResponse,
  vid: string,
  isNew: boolean
): void {
  if (isNew) {
    res.cookies.set(COOKIE_NAME, vid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
}

export async function GET(request: NextRequest) {
  // 1. vid取得/生成
  const { vid, isNew } = await getOrCreateVid();

  // 2. レート制限チェック
  const rateLimit = await checkRateLimit(vid);
  if (!rateLimit.allowed) {
    const res = NextResponse.json(
      { error: "Too Many Requests", message: "1分あたりのリクエスト上限に達しました" },
      { status: 429 }
    );
    res.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    res.headers.set("X-RateLimit-Remaining", "0");
    setCookieOnResponse(res, vid, isNew);
    return res;
  }

  // 3. bucket算出（JST 10分単位）
  const bucket = getBucket();

  // 4. genre決定（クエリ優先、なければハッシュで選択）
  const genreParam = request.nextUrl.searchParams.get("genre");
  const genre = parseGenre(genreParam) ?? selectGenre(vid, bucket);

  // 5. キャッシュチェック
  const cached = await getCachedStory(vid, bucket, genre);
  if (cached) {
    // キャッシュヒット
    const response: StoryResponse = {
      ...cached,
      meta: {
        ...cached.meta,
        cacheHit: true,
      },
    };
    const res = NextResponse.json(response);
    res.headers.set("X-Cache", "HIT");
    setCookieOnResponse(res, vid, isNew);
    return res;
  }

  // 6. キャッシュミス → storySpec生成
  const spec = generateStorySpec(vid, bucket, genre);

  // 7. AI生成（再試行あり）
  const aiStory = await generateStoryWithRetry(spec);
  const now = new Date().toISOString();

  let response: StoryResponse;
  let isFallback = false;

  if (aiStory) {
    // AI生成成功
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
    // AI生成失敗 → フォールバック
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

  // 8. キャッシュに保存
  await setCachedStory(vid, bucket, genre, response, isFallback);

  // 9. レスポンス返却
  const res = NextResponse.json(response);
  res.headers.set("X-Cache", "MISS");
  res.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  res.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  setCookieOnResponse(res, vid, isNew);
  return res;
}
