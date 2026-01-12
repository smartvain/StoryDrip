import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Today's Story - 今日のストーリー",
  description: "AIが生成する短いストーリーを毎日お届け",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
