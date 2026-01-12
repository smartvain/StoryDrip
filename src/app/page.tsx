import { cookies } from "next/headers";
import { getStory } from "@/lib/getStory";
import { genreLabels } from "@/lib/pools";

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE = 31536000;

export const dynamic = "force-dynamic";

export default async function Home() {
  const { story, newVid } = await getStory();

  // 新規vidの場合はcookieをセット
  if (newVid) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, newVid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  const genreLabel = genreLabels[story.genre];

  return (
    <main className="min-h-screen p-6 sm:p-8 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Today&apos;s Story
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          10分ごとに更新
        </p>
      </header>

      {/* ストーリーカード */}
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* タイトルとジャンル */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-3">
            {genreLabel}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {story.title}
          </h2>
        </div>

        {/* 登場人物 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{story.duo.animal}</span>
          <span className="mx-2">&</span>
          <span className="font-medium">{story.duo.human}</span>
        </div>

        {/* シーン */}
        <div className="space-y-4 mb-8">
          {story.scenes.map((scene, index) => (
            <p
              key={index}
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {scene}
            </p>
          ))}
        </div>

        {/* 余韻 */}
        <div className="mb-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 italic">
            {story.afterglow}
          </p>
        </div>

        {/* 引き */}
        <div className="py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-800 dark:text-gray-200 font-medium">
            {story.cliffhanger}
          </p>
        </div>
      </article>

      {/* フッター */}
      <footer className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
        <p>
          Generated at {new Date(story.meta.generatedAt).toLocaleString("ja-JP")}
        </p>
        {story.meta.cacheHit && (
          <p className="mt-1 text-green-600 dark:text-green-400">cached</p>
        )}
      </footer>
    </main>
  );
}
