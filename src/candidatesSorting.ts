import { cacheHasEntry, getCacheEntry, setCacheEntry } from "./utils/cache";
import { performance } from "perf_hooks";
import { sha256 } from "./utils/crypto";
import { Language } from "src/cli";
import { overrideStdOut, progressBar } from "./utils/cli";
const DEBUG = false;
const PERFORMANCE_LOGS = false;
const CACHE_LOGS = false;

if (DEBUG) {
  console.log("DEBUG mode is on");
}

export type Letter =
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
  | "ñ"
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

type LetterProbabilityDescriptor = { amount: number; probability: number };
type LetterProbabilities = { [key in Letter]?: LetterProbabilityDescriptor };
type WordSetByLetter = { [key in Letter]?: Set<string> };
export type WordWithPointsCombo = [string, number];

export const getWordLettersWithoutRepetition = (word: string): Letter[] =>
  Array.from(new Set(word.split(""))) as Letter[];

export const isLowerCase = (letter: Letter) => letter.toLowerCase() === letter;

export const getLetterProbabilitiesForWords = (
  words: string[],
  nonExcludingLetters: Set<Letter> = new Set()
): LetterProbabilities => {
  const t0 = performance.now();
  const letters: LetterProbabilities = {};

  words.forEach((word) => {
    const wordLetters = new Set(word.split("") as Letter[]);
    wordLetters.forEach((letter) => {
      if (nonExcludingLetters.has(letter)) {
        letters[letter] = { amount: 0, probability: 0 }; // amount of words removing is 0
        return;
      }
      if (!letters.hasOwnProperty(letter)) {
        letters[letter] = { amount: 0, probability: 0 };
      }

      letters[letter]!.amount += 1;
      letters[letter]!.probability = letters[letter]!.amount / words.length;
    });
  });

  if (DEBUG) {
    const sortedLetters = Object.entries(letters).sort(
      ([letter1, descriptor1], [letter2, descriptor2]) =>
        (descriptor2?.amount ?? 0) - (descriptor1?.amount ?? 0) // bigger on top
    );
    console.log(sortedLetters);
  }
  const t1 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log(`PERF: took ${t1 - t0}ms to get the letter probability`);
  }
  return letters;
};

/**
 * This returns the words that each letter would cancel
 */
export const getWordCancelledSetForLetters = (
  words: string[],
  nonExcludingLetters: Set<Letter>
): WordSetByLetter => {
  const t0 = performance.now();
  const wordSetCancelledByLetter: WordSetByLetter = {};

  words.forEach((word) => {
    const wordLetters = new Set<Letter>(word.split("") as Letter[]);
    wordLetters.forEach((letter) => {
      if (nonExcludingLetters.has(letter)) {
        // this letter won't remove a single word
        return;
      }
      if (!wordSetCancelledByLetter.hasOwnProperty(letter)) {
        wordSetCancelledByLetter[letter] = new Set();
      }

      wordSetCancelledByLetter[letter]?.add(word);
    });
  });

  const t1 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log(
      `PERF: took ${t1 - t0}ms to get the word cancelled set for letters`
    );
  }
  return wordSetCancelledByLetter;
};

const getWordPoints = (
  word: string,
  letterProbability: LetterProbabilities
) => {
  const wp = getWordLettersWithoutRepetition(word).reduce(
    (pointsSum, letter) =>
      pointsSum + letterProbability[letter as Letter]!.probability,
    0
  );

  return wp;
};

const getWordPointsFine = (
  word: string,
  wordSetCancelledByLetter: WordSetByLetter
) => {
  const wordsCancelledByWord = new Set([word]);
  getWordLettersWithoutRepetition(word).forEach((letter) => {
    if (DEBUG) {
      console.log(
        "letter:",
        letter,
        "size:",
        wordSetCancelledByLetter[letter]?.size
      );
    }
    wordSetCancelledByLetter[letter]?.forEach((cancelledWord) =>
      wordsCancelledByWord.add(cancelledWord)
    );
  });

  const wp = wordsCancelledByWord.size;
  if (DEBUG) {
    console.log("word:", word, "points:", wp);
  }

  return wp;
};

const getWordPointsBruteForce = (word: string, words: string[]): number => {
  const lettersInWord = getWordLettersWithoutRepetition(word);
  return words.reduce((acc, comparingWord) => {
    const comparingLetters = new Set(comparingWord.split(""));
    const wordWouldCancel = lettersInWord.some((letter) =>
      comparingLetters.has(letter)
    );
    return acc + (wordWouldCancel ? 1 : 0);
  }, 0);
};

export const sortWordsByLetterProbability = (
  wordArray: string[],
  nonExcludingLetters: Set<Letter>
) => {
  const letterProbability = getLetterProbabilitiesForWords(
    wordArray,
    nonExcludingLetters
  );
  const t0 = performance.now();
  const sortedWords = wordArray
    .map<WordWithPointsCombo>((word) => [
      word,
      getWordPoints(word, letterProbability),
    ])
    .sort(([a, aPoints], [b, bPoints]) => bPoints - aPoints);
  const t1 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log(`PERF: took ${t1 - t0}ms to normal sort the words`);
  }
  return sortedWords;
};

export const sortWordsByLetterProbabilityFine = (
  wordArray: string[],
  nonExcludingLetters: Set<Letter> = new Set()
) => {
  const wordArrayHash = sha256({ wordArray, nonExcludingLetters });
  if (cacheHasEntry(wordArrayHash)) {
    if (CACHE_LOGS) {
      console.log(`CACHE: Getting entry ${wordArrayHash} from cache`);
    }
    return getCacheEntry(wordArrayHash);
  } else if (CACHE_LOGS) {
    console.log(`CACHE: Entry ${wordArrayHash} not found on cache`);
  }
  const wordSetCancelledByLetter = getWordCancelledSetForLetters(
    wordArray,
    nonExcludingLetters
  );
  const t0 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log("");
  }
  const sortedWords = wordArray
    .map<WordWithPointsCombo>((word, idx) => {
      if (PERFORMANCE_LOGS) {
        progressBar(
          idx,
          wordArray.length,
          `${performance.now() - t0}ms to fine`
        );
      }
      return [word, getWordPointsFine(word, wordSetCancelledByLetter)];
    })
    .sort(([a, aPoints], [b, bPoints]) => bPoints - aPoints);
  setCacheEntry(wordArrayHash, sortedWords);
  if (CACHE_LOGS) {
    console.log(`CACHE: Entry ${wordArrayHash} set in cache`);
  }
  const t1 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log(`PERF: took ${t1 - t0}ms to fine sort the words`);
  }
  return sortedWords;
};

export const sortWordsByLetterProbabilityBruteForce = (
  wordArray: string[],
  nonExcludingLetters: Set<Letter> = new Set()
) => {
  const t0 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log("");
  }
  const sortedWords = wordArray
    .map<WordWithPointsCombo>((word, idx) => {
      if (PERFORMANCE_LOGS) {
        progressBar(
          idx,
          wordArray.length,
          `${performance.now() - t0}ms to brute-force`
        );
      }
      return [word, getWordPointsBruteForce(word, wordArray)];
    })
    .sort(([a, aPoints], [b, bPoints]) => bPoints - aPoints);
  const t1 = performance.now();
  if (PERFORMANCE_LOGS) {
    console.log(`PERF: took ${t1 - t0}ms to brute force sort the words`);
  }
  return sortedWords;
};
