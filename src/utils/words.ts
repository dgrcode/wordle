import { performance } from "perf_hooks";
import { Letter, LetterProbabilities, WordSetByLetter } from "src/types";

// TODO take this out of here. Adding temporarily for the linter
const DEBUG = false;
const PERFORMANCE_LOGS = false;

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
      ([_1, descriptor1], [_2, descriptor2]) =>
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
