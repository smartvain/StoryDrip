import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { StorySpec } from "./storySpec";
import { genreLabels, type Genre } from "./pools";
import type { AIStory } from "./schema";

// AI生成用のスキーマ（Vercel AI SDK用）
const AIStoryGenerationSchema = z.object({
  title: z.string().describe("短めのタイトル（20文字以内）"),
  genre: z.enum(["kando", "mystery", "comedy"]).describe("ジャンル"),
  duo: z.object({
    animal: z.string().describe("動物キャラクター名"),
    human: z.string().describe("人間キャラクター名"),
  }),
  scenes: z
    .array(z.string())
    .length(7)
    .describe("7つのシーン（各1文、映像が浮かぶ短文）"),
  afterglow: z.string().describe("余韻（1文）"),
  cliffhanger: z.string().describe("引き（1文、続きが気になるが恐怖に寄せない）"),
});

/**
 * システムプロンプト
 */
const SYSTEM_PROMPT = `あなたは短編ストーリー作家です。与えられた設定に基づいて、映像的で短いストーリーを生成します。

【絶対ルール】
- セリフ（「」）は禁止。字幕っぽい説明も避け、映像優先で短文にする
- 残酷/暴力/性的/差別の表現は禁止
- 実在人物・実在事件・固有ブランド名（企業/商品/サービス名）を出さない
- 違法行為の指南、医療アドバイス、扇動はしない

【シーンの書き方】
- 各シーンは1文で、読者の頭に映像が浮かぶように
- 説明的にならず、具体的な動作や情景を描写

【引き（cliffhanger）の書き方】
次のいずれかを必ず含む：
- 未回収の手がかり（物・刻印・番号・音など）
- 次の行動の予告（走り出す/振り返る/扉が開く など）
- 静かな異変（灯り/時計/標識/合図など）
※ホラー・グロ方向の恐怖煽りはしない`;

/**
 * ユーザープロンプトを生成
 */
function buildUserPrompt(spec: StorySpec): string {
  return `以下の設定でストーリーを生成してください。

【設定】
- ジャンル: ${genreLabels[spec.genre]}
- 舞台: ${spec.setting}
- 動物: ${spec.animal}
- 相棒（人間）: ${spec.human}
- 謎の種: ${spec.mysterySeed}
- 制約: ${spec.constraint}
- 反転: ${spec.twist}
- 引きの鍵: ${spec.hookItem}

この設定を活かして、7シーンのストーリーを作成してください。
余韻と引きも忘れずに。引きには「${spec.hookItem}」を使ってください。`;
}

/**
 * AI でストーリーを生成
 */
export async function generateStory(spec: StorySpec): Promise<AIStory | null> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: AIStoryGenerationSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(spec),
      temperature: 0.8,
    });

    return result.object as AIStory;
  } catch (error) {
    console.error("AI generation error:", error);
    return null;
  }
}

/**
 * AI生成を再試行（より強くJSONを要求）
 */
export async function generateStoryWithRetry(
  spec: StorySpec
): Promise<AIStory | null> {
  // 1回目
  const first = await generateStory(spec);
  if (first) return first;

  console.log("First generation failed, retrying...");

  // 2回目（再試行）
  const second = await generateStory(spec);
  return second;
}

/**
 * フォールバック用のテンプレートストーリー
 */
export function getFallbackStory(spec: StorySpec): AIStory {
  return {
    title: `${spec.setting}の小さな奇跡`,
    genre: spec.genre,
    duo: {
      animal: spec.animal,
      human: spec.human,
    },
    scenes: [
      `${spec.setting}の朝、${spec.animal}が目を覚ました。`,
      `${spec.human}が静かに近づいてきた。`,
      `二人の間に、${spec.mysterySeed}があった。`,
      `${spec.constraint}という状況の中、二人は顔を見合わせた。`,
      `ふと、${spec.twist}ことに気づいた。`,
      `${spec.animal}が一歩、前に踏み出した。`,
      `${spec.human}がそっと微笑んだ。`,
    ],
    afterglow: "穏やかな風が、二人の間を吹き抜けていった。",
    cliffhanger: `そのとき、${spec.hookItem}。`,
  };
}
