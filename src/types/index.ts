/**
 * - wrong: the given candidate has the wrong letter in that position
 * - letter: the given candidate has the right letter, but in the wrong position
 * - good: the given candidate has the right letter in that position
 */
export type PositionStatus = "wrong" | "letter" | "good";

/**
 * Supported languages
 */
export type Language = "en" | "es";

export type LanguageDescriptor = {
  label: string;
  emoji: string;
  words: string[];
};

type LetterEn =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

type LetterEs = LetterEn | "ñ";

export type Letter = LetterEn | LetterEs;

type LetterProbabilityDescriptor = { amount: number; probability: number };
export type LetterProbabilities = {
  [key in Letter]?: LetterProbabilityDescriptor;
};
export type WordSetByLetter = { [key in Letter]?: Set<string> };
export type WordWithPointsCombo = [string, number];

export type Cache = {
  [key: string]: WordWithPointsCombo[];
};

export type Result = "green" | "yellow" | "gray";

export type WordleResult = Array<Result> &
  [Result, Result, Result, Result, Result];
