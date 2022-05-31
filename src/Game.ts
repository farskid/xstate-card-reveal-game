import autoBind from "auto-bind";
import { nanoid } from "nanoid";
import { shuffleArray, chunk, getMidDivisors } from "./gameUtils";

export class Card {
  public readonly id: string;
  constructor(readonly value: number) {
    this.id = nanoid();
  }
}

// 1,2,3,...,15 (total/2)
function makeRandomLayout(total: number): Card[][] {
  let all = Array.from({ length: total / 2 }, (_, i) => [
    new Card(i + 1),
    new Card(i + 1)
  ]).flat();
  // shuffle it
  all = shuffleArray(all);
  // tranform to a matrix
  const matrix = chunk(all, getMidDivisors(total)[0]);

  return matrix;
}

export class CardGame {
  public layout: Card[][] = [];
  public initialized: boolean;
  public options: {
    totalCards: number;
    preGameRevealMs: number;
    gameTimeMs: number;
    showcaseTimeMs: number;
    singleCardTimeoutMs: number;
  };
  constructor(options = {}) {
    this.options = {
      totalCards: 30,
      preGameRevealMs: 5_000,
      gameTimeMs: 30_000,
      showcaseTimeMs: 1_000,
      singleCardTimeoutMs: 1_000,
      ...options
    };
    this.initialized = false;

    autoBind(this);
  }

  init() {
    this.layout = makeRandomLayout(this.options.totalCards);
    this.initialized = true;
    return this;
  }
}
