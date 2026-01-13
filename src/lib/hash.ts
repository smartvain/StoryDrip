import { createHash } from "crypto";

/**
 * JST（UTC+9）の日時を取得
 */
export function getJSTDate(date: Date = new Date()): Date {
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(date.getTime() + jstOffset);
}

/**
 * 文字列からSHA256ハッシュを生成し、0以上の整数を返す
 */
export function hashToInt(input: string): number {
  const hash = createHash("sha256").update(input).digest("hex");
  // 最初の8文字（32bit）を整数に変換
  return parseInt(hash.slice(0, 8), 16);
}

/**
 * ハッシュ値を使って配列からインデックスを選択
 */
export function selectByHash<T>(arr: readonly T[], input: string): T {
  const idx = hashToInt(input) % arr.length;
  return arr[idx];
}

/**
 * 10分バケットを算出（JST）
 * 形式: YYYYMMDDHHmm（分は10分単位で切り捨て）
 */
export function getBucket(date: Date = new Date()): string {
  const jstDate = getJSTDate(date);

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  const hour = String(jstDate.getUTCHours()).padStart(2, "0");
  // 10分単位で切り捨て
  const minute = String(Math.floor(jstDate.getUTCMinutes() / 10) * 10).padStart(
    2,
    "0"
  );

  return `${year}${month}${day}${hour}${minute}`;
}

/**
 * 分単位のバケットを算出（JST）
 * 形式: YYYYMMDDHHmm
 */
export function getMinuteBucket(date: Date = new Date()): string {
  const jstDate = getJSTDate(date);

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  const hour = String(jstDate.getUTCHours()).padStart(2, "0");
  const minute = String(jstDate.getUTCMinutes()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}`;
}
