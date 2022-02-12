This project shows some strategies to find a good candidate when playing wordle.

# Commands

- To run the program via command line interface, run `yarn cli`
- To run the TS compiler when a file changes, run it in watch mode with `yarn watch`

# Algorithms

There are mainly 2 algorithms explored:

- Sorting candidates by letter probability
- Sorting candidates by candidates removed
- Sorting candidates by average candidates removed

The main concept of each algorithm follows in different sections. However, these algorithms are all focused on removing the biggest amount of candidates possible, not in finding the target word. This is, the algorithms described here are not _good at winning_, but rather _good at loosing_, so following rounds are easier. Once there is a small number of candidates, the player might prefer to pick a "common word" trying to pick a winner, rather than following these algorithms to remove more candidates.

## Letter Probability Algorithm

For each round, until the game finishes:

1. Compute the probabilities of a word having a given letter, for each alphabet letter. Let's call this `P_letter`
2. Compute the points of each word as the sum of `P_letter`, for each of the word letters (without repetitions)
3. Pick the candidate with the highest points

Can we do better? Yes. This approach doesn't take into account the possible letter combinations that would remove the same candidates. Read more [here](https://dgrcode.substack.com/p/my-approach-to-solving-wordle)

## Candidates Removed

For each round, until the game finishes:

1. Compute the amount of candidates each word would eliminate
   1. For each letter in the alphabet, pre-compute a Set of words that the letter would eliminate. Let's call each of those sets `S_{letter}`, i.e. `S_a`, `S_b`, and so on.
   2. For each word, do:
      1. Compute the letters without repetitions in the word. Let's call this group of letters `L`.
      2. Compute the [union](<https://en.wikipedia.org/wiki/Union_(set_theory)>) of the `S_{letter}` of all the letters in `L`. This is ⋃S\_{letter} ∀ {letter} in L
      3. The amount of candidates the word would eliminate is exactly the size of the resulting union set
1. Pick the candidate that would eliminate the biggest amount of candidates.

Can we do better? Yes. This approach computes how many candidates the word would eliminate if all the letters are not in the target word. The computation is correct only when all the letters fail, which can't happen for all words (at least one must be the target), and therefore is not ideal for comparing candidates.

## Average Candidates Removed

For each round, until the game finises:

1. Compute the amount of candidates the word would eliminate _on average_. This will be detailed in a future article (TODO pending writing).
2. Pick the candidate that would eliminate the biggest amount of candidates on average.

The on average here is key, because now we're considering all the scenarios, not just the scenario where all letters get a gray result.

Can we do better? I don't think so, from a statistics point of view. We could take into account how common words are, but that's taking advantage of a situation that could change in the future. So I would say this is the best method for a large amount of trials.
