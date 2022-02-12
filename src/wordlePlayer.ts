import spanishWords from "an-array-of-spanish-words";
import englishWords from "an-array-of-english-words";
import {
  Language,
  LanguageDescriptor,
  Letter,
  WordWithPointsCombo,
} from "./types";
import solver from "./wordleSolver";
import logs from "./loggingControls";
import { initCache } from "./utils/cache";
import { wordleGame } from "./wordleGame";

const languageDescriptor: { [key in Language]: LanguageDescriptor } = {
  en: {
    label: "English",
    emoji: "🇬🇧",
    words: englishWords,
  },
  es: {
    label: "Spanish",
    emoji: "🇪🇸",
    words: spanishWords,
  },
};

async function playGame() {
  // console.log("Wordle auto player begins!");
  const language = "en"; // only auto-playing english for now

  const langDescriptor = languageDescriptor[language];
  initCache(language);

  let candidates = langDescriptor.words;

  const missingLetters: Letter[] = [];
  let pattern;
  let currentRound = 1;
  const game = wordleGame();
  game.next();
  while (true) {
    if (logs.debug) {
      // console.log("DEBUG: missingLetters", missingLetters);
      // console.log("DEBUG: pattern", pattern);
    }

    // console.log(`PLAYER: -- ROUND ${currentRound} --`);
    // show candidates
    const candidatesWithPoints: WordWithPointsCombo[] = solver(
      candidates,
      missingLetters,
      pattern
    );
    candidates = candidatesWithPoints.map(([word]) => word);
    const triedCandidate = candidates[0];

    if (!triedCandidate) {
      // console.log(
      `PLAYER: run out of candidates. surrender in ${currentRound} rounds`;
      // );
      break;
    }

    // console.log("PLAYER: trying", triedCandidate);
    const {
      value: { result, round },
    } = game.next(triedCandidate);
    currentRound = round + 1;
    // console.log("PLAYER: received result", result);

    if (result === true) {
      console.log(`PLAYER: won in ${currentRound} rounds`);
      break;
    }
    if (result === false) {
      console.log(`PLAYER: lost in ${currentRound} rounds`);
      break;
    }
    if (result === null) {
      throw new Error("PLAYER: Invalid candidate. What happened?");
    }

    pattern = triedCandidate
      .split("")
      .map((ci, idx) =>
        result[idx] === "green"
          ? ci
          : result[idx] === "yellow"
          ? ci.toUpperCase()
          : "*"
      )
      .join("");
    // console.log("PLAYER: pattern", pattern);

    result.forEach((ri, idx) => {
      if (ri === "gray") {
        missingLetters.push(triedCandidate[idx] as Letter);
      }
    });
  }
}

playGame();
