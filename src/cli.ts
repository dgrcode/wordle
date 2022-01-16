import spanishWords from "an-array-of-spanish-words";
import englishWords from "an-array-of-english-words";
import chalk, { ChalkFunction } from "chalk";
import inquirer, { InputQuestionOptions } from "inquirer";
import {
  Language,
  LanguageDescriptor,
  Letter,
  PositionStatus,
  WordWithPointsCombo,
} from "./types";
import wordl from "./wordle";
import logs from "./loggingControls";
import { isLowerCase } from "./utils/words";
import { initCache } from "./utils/cache";

const statusToChalkMap: { [key in PositionStatus]: ChalkFunction } = {
  wrong: chalk.bgGray.white.bold,
  letter: chalk.bgYellow.white.bold,
  good: chalk.bgGreen.white.bold,
};

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

const emojiToLangMap: { [key: string]: Language } = {};
Object.entries(languageDescriptor).forEach(([lang, { emoji }]) => {
  emojiToLangMap[emoji] = lang as Language;
});

const question = async (message: string, options?: InputQuestionOptions) => {
  const { res } = await inquirer.prompt([{ message, name: "res", ...options }]);
  return res as string;
};

const questionPatterWithConfirmation = async (
  message: string,
  triedCandidate: string,
  stackedVisualPatterns: string[]
): Promise<{
  resultingPattern: string;
  visualPattern: string;
}> => {
  const resultingPattern = await question(message);

  const resultingStatus = resultingPattern
    .split("")
    .map<PositionStatus>((letter, idx) => {
      if (resultingPattern[idx] === "*") {
        // add the letter to the missingLetters
        return "wrong";
      }
      if (isLowerCase(resultingPattern[idx] as Letter)) {
        return "good";
      }
      return "letter";
    });

  const visualPattern = triedCandidate
    .split("")
    .map((letter, idx) =>
      statusToChalkMap[resultingStatus[idx]](letter.toUpperCase())
    )
    .join("");

  const hasConfirmed = await question(
    `Is this the result on the game?\n\n\t${[
      ...stackedVisualPatterns,
      visualPattern,
    ].join("\n\t")}\n\n`,
    { type: "confirm" }
  );

  if (!hasConfirmed) {
    return questionPatterWithConfirmation(
      message,
      triedCandidate,
      stackedVisualPatterns
    );
  }
  return { resultingPattern, visualPattern };
};

async function main() {
  console.log("Wordle begins!");
  const { language } = await inquirer.prompt({
    name: "language",
    message: "What language are you playing?",
    type: "list",
    choices: Object.values(languageDescriptor).map(({ emoji }) => emoji),
  });

  const langCode = emojiToLangMap[language];
  const langDescriptor = languageDescriptor[langCode];
  initCache(langCode);

  let hasFoundWord = false;
  let candidates = langDescriptor.words;
  const missingLetters: Letter[] = [];
  const stackedVisualPatterns: string[] = [];
  let pattern;
  while (!hasFoundWord) {
    if (logs.debug) {
      console.log("DEBUG: missingLetters", missingLetters);
      console.log("DEBUG: pattern", pattern);
    }

    // show candidates
    const candidatesWithPoints: WordWithPointsCombo[] = wordl(
      candidates,
      missingLetters,
      pattern
    );
    candidates = candidatesWithPoints.map(([word]) => word);
    // input new word tried
    console.log(candidatesWithPoints);

    // input result
    const triedCandidate = await question("Input candidate tried");

    // hasFoundWord or newRound?
    const { resultingPattern, visualPattern } =
      await questionPatterWithConfirmation(
        "Input resulting pattern",
        triedCandidate,
        stackedVisualPatterns
      );

    stackedVisualPatterns.push(visualPattern);
    pattern = resultingPattern;
    const lowercasePattern = resultingPattern.toLowerCase();
    triedCandidate.split("").forEach((letter) => {
      if (lowercasePattern.indexOf(letter) === -1) {
        missingLetters.push(letter as Letter);
      }
    });

    hasFoundWord = pattern.indexOf("*") === -1 && pattern === lowercasePattern;
  }

  console.log(
    `          ${chalk.bgHex("#35ff35").hex("#35ff35").bold("    ")}          `
  );
  console.log(
    `          ${chalk.bgHex("#35ff35").hex("#000").bold(" 🥳 ")}          `
  );
  console.log(
    `          ${chalk
      .bgHex("#35ff35")
      .hex("#35ff35")
      .bold("    ")}          \n`
  );
}

main();
