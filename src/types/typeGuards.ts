import type { Result, WordleResult } from "./";

export const isWordleResult = (arr: Array<Result>): arr is WordleResult =>
  arr.length === 5;
