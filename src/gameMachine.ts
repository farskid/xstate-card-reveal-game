import { assign, createMachine } from "xstate";
import { raise, send, choose } from "xstate/lib/actions";
import { Card } from "./Game";

export const gameLogicMachine = createMachine({
  schema: {
    context: {} as {
      tempCards: Card[];
      revealedCards: string[];
      totalCards: number;
      remainingTime: number;
    }
  },
  initial: "not_started",
  id: "root",
  on: {
    game_won: "game_won",
    game_over: "game_over",
    start: {
      actions: ["clearContext"],
      target: "pre_game_revealing"
    },
    decrement_remaining_time: {
      actions: [
        assign({ remainingTime: (ctx) => ctx.remainingTime - 1 }),
        choose([
          {
            cond: (ctx) => ctx.remainingTime === 0,
            actions: raise({ type: "game_over" })
          }
        ])
      ]
    }
  },
  states: {
    not_started: {
      on: {
        start: "pre_game_revealing"
      }
    },
    pre_game_revealing: {
      after: {
        PRE_GAME_REVEAL_MS: "running"
      }
    },
    running: {
      initial: "active",
      tags: ["running"],
      invoke: {
        src: (ctx) => (sendBack) => {
          let id = setInterval(() => {
            sendBack({
              type: "decrement_remaining_time"
            });
          }, 1000);

          return () => {
            clearInterval(id);
          };
        }
      },
      states: {
        active: {
          entry: ["checkIfGameIsFinished"],
          on: {
            open_card: [
              {
                cond: "secondCardBeingOpenAndcardDoesNotExistInTemp",
                target: "showcase",
                actions: ["saveTempCard"]
              },
              {
                cond: "cardDoesNotExistInTemp",
                actions: ["saveTempCard"],
                // we need to retransition to the current state rather than not transitioning because we want the timer of clearing temp cards to reset.
                target: "active",
                internal: false
              }
            ]
          },
          after: {
            SINGLE_CARD_DELAY_MS: {
              actions: ["clearTempCards"]
            }
          }
        },
        showcase: {
          description: "That slight delay when you show the two open cards",
          always: {
            target: "active",
            cond: "tempCardsMatch",
            actions: ["savePairs"]
          },
          after: {
            SHOWCASE_MS: {
              target: "active",
              actions: ["clearTempCards"]
            }
          }
        }
      }
    },
    game_over: {
      // type: "final"
    },
    game_won: {
      // type: "final"
    }
  }
});
