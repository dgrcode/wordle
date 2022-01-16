import fs from "fs";
import path from "path";
import { Cache, Language, WordWithPointsCombo } from "src/types";

let cache: Cache = {};
let isCacheInit = false;
let langInUse: Language;

export const initCache = (langCode: Language) => {
  const file = fs.readFileSync(
    path.resolve(`./cache/${langCode}.json`),
    "utf-8"
  );
  cache = JSON.parse(file);
  isCacheInit = true;
  langInUse = langCode;
};

const saveCache = (data: Cache) => {
  if (!isCacheInit) {
    throw new Error(
      "Cache has not been initialized. Make sure you are initializing it."
    );
  }
  fs.writeFileSync(
    path.resolve(`./cache/${langInUse}.json`),
    JSON.stringify(data)
  );
};

export const getCacheEntry = (key: string) => {
  if (!isCacheInit) {
    throw new Error(
      "Cache has not been initialized. Make sure you are initializing it."
    );
  }
  return cache[key];
};

export const cacheHasEntry = (key: string) => {
  if (!isCacheInit) {
    throw new Error(
      "Cache has not been initialized. Make sure you are initializing it."
    );
  }
  return cache.hasOwnProperty(key);
};

export const setCacheEntry = (key: string, value: WordWithPointsCombo[]) => {
  cache[key] = value;
  saveCache(cache);
};
