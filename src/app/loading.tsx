export default function Loading() {
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

      {/* スケルトン */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        {/* ジャンルバッジ */}
        <div className="mb-3">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* タイトル */}
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

        {/* 登場人物 */}
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

        {/* シーン */}
        <div className="space-y-4 mb-8">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>

        {/* 余韻 */}
        <div className="py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* 引き */}
        <div className="py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* ローディングテキスト */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ストーリーを生成中...
        </p>
      </div>
    </main>
  );
}
