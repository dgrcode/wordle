import chalk from "chalk";
const WIDTH = 80;

const progressBarAt = (
  progress: number,
  onChar: string = chalk.bgGreen(" "),
  offChar: string = chalk.bgWhite(" "),
  justChar: string = chalk.bgGreenBright(" ")
) => {
  const toWidth = Math.floor(progress * WIDTH);
  return Array.from({ length: WIDTH })
    .map((_, idx) =>
      idx === toWidth ? justChar : idx < toWidth ? onChar : offChar
    )
    .join("");
};

export const overrideStdOut = (...str: string[]) => {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(str.join(" "));
};

export const progressBar = (
  current: number,
  max: number,
  extra: string = ""
) => {
  const progress = current / max;
  overrideStdOut(
    `${progressBarAt(progress)} (${current}/${max})${
      current === max ? "\n" : ""
    }${extra}`
  );
};

// let status = 0;
// const max = 20;
// const tick = () => {
//   status++;

//   if (status < max) {
//     setTimeout(tick, 100);
//   }
//   progressBar(status, max);
// };

// tick();
