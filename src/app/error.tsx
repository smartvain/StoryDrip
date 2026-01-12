"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen p-6 sm:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          エラーが発生しました
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ストーリーの読み込み中に問題が発生しました。
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          もう一度試す
        </button>
      </div>
    </main>
  );
}
