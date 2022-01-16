import { cacheHasEntry, getCacheEntry, setCacheEntry } from "./utils/cache";
import { performance } from "perf_hooks";
import {
  Letter,
  LetterProbabilities,
  WordSetByLetter,
  WordWithPointsCombo,
} from "./types";
import logs from "./loggingControls";
import { sha256 } from "./utils/crypto";
import { progressBar } from "./utils/cli";
import {
  getLetterProbabilitiesForWords,
  getWordLettersWithoutRepetition,
  getWordCancelledSetForLetters,
} from "./utils/words";

if (logs.debug) {
  console.log("DEBUG mode is on");
}

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
    if (logs.debug) {
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

  if (logs.debug) {
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
  if (logs.performance) {
    console.log(`PERF: took ${t1 - t0}ms to normal sort the words`);
  }

  return sortedWords;
};

export const sortWordsByLetterProbabilityFine = (
  wordArray: string[],
  nonExcludingLetters: Set<Letter> = new Set()
) => {
  // try to get results from cache
  const wordArrayHash = sha256({ wordArray, nonExcludingLetters });
  if (cacheHasEntry(wordArrayHash)) {
    if (logs.cache) {
      console.log(`CACHE: Getting entry ${wordArrayHash} from cache`);
    }
    return getCacheEntry(wordArrayHash);
  } else if (logs.cache) {
    console.log(`CACHE: Entry ${wordArrayHash} not found on cache`);
  }

  // it wasn't in cache, compute the results
  const wordSetCancelledByLetter = getWordCancelledSetForLetters(
    wordArray,
    nonExcludingLetters
  );
  const t0 = performance.now();
  if (logs.performance) {
    console.log("");
  }

  const sortedWords = wordArray
    .map<WordWithPointsCombo>((word, idx) => {
      if (logs.performance) {
        progressBar(
          idx,
          wordArray.length,
          `${performance.now() - t0}ms to fine`
        );
      }

      return [word, getWordPointsFine(word, wordSetCancelledByLetter)];
    })
    .sort(([_a, aPoints], [_b, bPoints]) => bPoints - aPoints);

  setCacheEntry(wordArrayHash, sortedWords);
  if (logs.cache) {
    console.log(`CACHE: Entry ${wordArrayHash} set in cache`);
  }
  const t1 = performance.now();
  if (logs.performance) {
    console.log(`PERF: took ${t1 - t0}ms to fine sort the words`);
  }
  return sortedWords;
};

export const sortWordsByLetterProbabilityBruteForce = (
  wordArray: string[],
  nonExcludingLetters: Set<Letter> = new Set()
) => {
  // TODO take non-excluding letters into account
  // TODO - explain what's a non-excluding letter
  const t0 = performance.now();
  if (logs.performance) {
    console.log("");
  }

  const sortedWords = wordArray
    .map<WordWithPointsCombo>((word, idx) => {
      if (logs.performance) {
        progressBar(
          idx,
          wordArray.length,
          `${performance.now() - t0}ms to brute-force`
        );
      }

      return [word, getWordPointsBruteForce(word, wordArray)];
    })
    .sort(([_a, aPoints], [_b, bPoints]) => bPoints - aPoints);

  const t1 = performance.now();
  if (logs.performance) {
    console.log(`PERF: took ${t1 - t0}ms to brute force sort the words`);
  }
  return sortedWords;
};
