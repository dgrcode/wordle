import { Letter } from "./types";
import logs from "./loggingControls";
import { isLowerCase } from "./utils/words";
import { sortWordsByWordsRemoved } from "./candidatesSorting";

// TODOs
// - show the words that increase the most from one round to the next

const wordSize = 5;

const roundSolver = (
  remainingWords: string[],
  missingLetters: Letter[],
  pattern?: string
) => {
  const patternLetters = !pattern
    ? []
    : (pattern
        .split("")
        .map((letter) => letter.toLowerCase())
        .filter((letter) => letter !== "*") as Letter[]);
  if (logs.debug) {
    console.log("DEBUG: patternLetters", patternLetters);
  }

  const candidates = remainingWords
    .filter((word) => word.length === wordSize) // right size
    .filter(
      // right letters
      (word) =>
        missingLetters.every((letter) => word.indexOf(letter) === -1) &&
        [...patternLetters].every((letter) => word.indexOf(letter) !== -1)
    )
    .filter((word) => {
      // pattern matching
      if (!pattern) {
        // allow all words if there is no pattern
        if (logs.debug) {
          console.log("DEBUG: no pattern");
        }
        return true;
      }

      // Lower case letters are in the right place
      // Upper case letters are in the wrong place
      for (let i = 0; i < wordSize; i++) {
        const char = pattern[i];
        if (char !== "*") {
          const patternLetter = char as Letter;
          const letter = patternLetter.toLowerCase();
          const isInRightPosition = isLowerCase(patternLetter);
          if (isInRightPosition && word[i] !== letter) {
            // this `word[i]` is expected to be `letter`. out
            if (logs.debug) {
              console.log(
                `DEBUG: removing ${word}. Expected ${patternLetter} in position ${i}. Not found'`
              );
            }
            return false;
          }
          if (!isInRightPosition && word[i] === letter) {
            // this `word[i]` was not `letter` before. out
            if (logs.debug) {
              console.log(
                `DEBUG: removing ${word}. Letter ${patternLetter} not expected in position ${i}, but was present'`
              );
            }
            return false;
          }
        }
      }
      return true;
    });

  if (logs.debug) {
    console.log(
      "Candidates passing filters (letters and pattern):",
      candidates.length
    );
  }

  const nonExcludingLetters = new Set(patternLetters); // letters that don't exclude words

  return sortWordsByWordsRemoved(candidates, nonExcludingLetters);
};

export default roundSolver;
