import enSolutions from "./data/enSolutions";
import { Result, WordleResult } from "./types";
import { isWordleResult } from "./types/typeGuards";

export function* wordleGame(
  maxRounds: number = 6,
  givenTarget?: string
): Generator<
  { result: WordleResult | null; round: number },
  { result: boolean; round: number },
  string
> {
  // console.log("GAME: start game");
  let round = 0;
  const target =
    givenTarget ?? enSolutions[Math.floor(Math.random() * enSolutions.length)];
  console.log(`GAME: target is ${target}`);

  let guess = null;
  while (round < maxRounds) {
    if (guess === null) {
      // console.log("GAME: waiting first guess");
      // first guess
      guess = yield { result: null, round };
      // console.log("GAME: received guess", guess);
    }
    guess = guess.toLowerCase();
    if (guess === target) {
      // console.log("GAME: guess is the target. win");
      return { result: true, round };
    }

    const result: Array<Result> = guess.split("").map(
      (gi, idx) =>
        // TODO check what's going on with double letters here
        (gi === target[idx]
          ? "green"
          : target.includes(gi)
          ? "yellow"
          : "gray") as Result
    );
    // console.log("GAME: result", result);

    if (!isWordleResult(result)) {
      // console.log("GAME: invalid result, waiting for a new one");
      guess = yield { result: null, round };
    } else {
      round++;
      // console.log(`GAME: round ${round}, waiting for a new guess`);
      guess = yield { result, round };
    }
  }
  // console.log("GAME: finished all rounds. lose");
  return { result: false, round };
}
