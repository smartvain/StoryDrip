import { z } from "zod";

// ジャンルのスキーマ
export const GenreSchema = z.enum(["kando", "mystery", "comedy"]);

// AI生成結果のスキーマ（AIから返ってくる部分のみ）
export const AIStorySchema = z.object({
  title: z.string().min(1).max(50),
  genre: GenreSchema,
  duo: z.object({
    animal: z.string().min(1),
    human: z.string().min(1),
  }),
  scenes: z
    .array(z.string().min(1))
    .length(7, "scenes must have exactly 7 items"),
  afterglow: z.string().min(1),
  cliffhanger: z.string().min(1),
});

// シード情報のスキーマ
export const SeedSchema = z.object({
  setting: z.string(),
  mysterySeed: z.string(),
  constraint: z.string(),
  twist: z.string(),
  hookItem: z.string(),
});

// メタ情報のスキーマ
export const MetaSchema = z.object({
  vid: z.string(),
  bucket: z.string(),
  cacheHit: z.boolean(),
  generatedAt: z.string(),
});

// 完全なストーリーレスポンスのスキーマ
export const StoryResponseSchema = z.object({
  title: z.string(),
  genre: GenreSchema,
  duo: z.object({
    animal: z.string(),
    human: z.string(),
  }),
  scenes: z.array(z.string()).length(7),
  afterglow: z.string(),
  cliffhanger: z.string(),
  seed: SeedSchema,
  meta: MetaSchema,
});

// 型エクスポート
export type AIStory = z.infer<typeof AIStorySchema>;
export type StoryResponse = z.infer<typeof StoryResponseSchema>;
export type Seed = z.infer<typeof SeedSchema>;
export type Meta = z.infer<typeof MetaSchema>;

/**
 * AI生成結果を検証
 */
export function validateAIStory(data: unknown): AIStory {
  return AIStorySchema.parse(data);
}

/**
 * AI生成結果を安全に検証（エラー時はnull）
 */
export function safeValidateAIStory(
  data: unknown
): { success: true; data: AIStory } | { success: false; error: z.ZodError } {
  const result = AIStorySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
