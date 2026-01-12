import { selectByHash } from "./hash";
import {
  type Genre,
  genres,
  settings,
  animals,
  humans,
  mysterySeeds,
  constraints,
  twists,
  hookItems,
} from "./pools";

export interface StorySpec {
  genre: Genre;
  setting: string;
  animal: string;
  human: string;
  mysterySeed: string;
  constraint: string;
  twist: string;
  hookItem: string;
}

/**
 * vid, bucket, genreからStorySpecを決定論的に生成
 * 同じ入力に対しては常に同じ出力を返す
 */
export function generateStorySpec(
  vid: string,
  bucket: string,
  genre: Genre
): StorySpec {
  const base = `${vid}:${bucket}:${genre}`;

  return {
    genre,
    setting: selectByHash(settings, `${base}:setting`),
    animal: selectByHash(animals, `${base}:animal`),
    human: selectByHash(humans, `${base}:human`),
    mysterySeed: selectByHash(mysterySeeds, `${base}:mysterySeed`),
    constraint: selectByHash(constraints, `${base}:constraint`),
    twist: selectByHash(twists, `${base}:twist`),
    hookItem: selectByHash(hookItems, `${base}:hookItem`),
  };
}

/**
 * vid + bucketからgenreを決定論的に選択
 */
export function selectGenre(vid: string, bucket: string): Genre {
  return selectByHash(genres, `${vid}:${bucket}:genre`);
}
