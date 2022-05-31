import { useInterpret, useSelector } from "@xstate/react";
import { useState, useEffect } from "react";
import { assign } from "xstate";
import { choose, raise } from "xstate/lib/actionTypes";
import { CardGame } from "./Game";
import { gameLogicMachine } from "./gameMachine";

export function useRemainingTimer(maxMs: number) {
  const [sec, setSec] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started) {
      let id = setInterval(() => {
        setSec((sec) => sec + 1);
      }, 1000);
      return () => {
        clearInterval(id);
      };
    }
  }, [maxMs, started]);

  return {
    remaining: maxMs / 1000 - sec,
    started,
    start() {
      setStarted(true);
    },
    stop() {
      setStarted(false);
    }
  };
}

export function useGame(options?: Partial<CardGame["options"]>) {
  const game = new CardGame(options).init();
  const gameMachine = useInterpret(gameLogicMachine, {
    context: {
      totalCards: game.options.totalCards,
      tempCards: [], // Card[]
      revealedCards: [] // string[] of card IDs
    },
    delays: {
      GAME_TIME_MS: game.options.gameTimeMs,
      PRE_GAME_REVEAL_MS: game.options.preGameRevealMs,
      SHOWCASE_MS: game.options.showcaseTimeMs,
      SINGLE_CARD_DELAY_MS: game.options.singleCardTimeoutMs
    },
    guards: {
      secondCardBeingOpen: (ctx) => ctx.tempCards.length === 1,
      tempCardsMatch: (ctx) =>
        ctx.tempCards[0]?.value === ctx.tempCards[1]?.value,
      cardDoesNotExistInTemp: (ctx, e) =>
        !ctx.tempCards.find((card) => card.id === e.card.id),
      secondCardBeingOpenAndcardDoesNotExistInTemp: (ctx, e) =>
        ctx.tempCards.length === 1 &&
        !ctx.tempCards.find((card) => card.id === e.card.id)
    },
    actions: {
      saveTempCard: assign((ctx, e) => {
        console.log("save", e, ctx.tempCards.concat(e.card));
        return {
          ...ctx,
          tempCards: ctx.tempCards.concat(e.card)
        };
      }),
      savePairs: assign((ctx) => {
        // if two cards are present and they match
        if (
          ctx.tempCards.length === 2 &&
          ctx.tempCards[0].value === ctx.tempCards[1].value
        ) {
          return {
            ...ctx,
            revealedCards: ctx.revealedCards.concat(
              ...ctx.tempCards.map((card) => card.id)
            ),
            tempCards: []
          };
        }

        return ctx;
      }),
      clearTempCards: assign((ctx) => {
        return {
          ...ctx,
          tempCards: []
        };
      }),
      checkIfGameIsFinished: choose([
        {
          cond: (ctx) => ctx.revealedCards.length === ctx.totalCards,
          actions: raise({ type: "game_won" })
        }
      ])
    }
  }).init();

  const timer = useRemainingTimer(game.options.gameTimeMs);

  const { isRunning, debug, isCardRevealed, tempCards } = useSelector(
    gameMachine,
    (state) => {
      // console.log(state.context.tempCards);
      return {
        debug: state.value,
        isRunning: state.hasTag("running"),
        tempCards: state.context.tempCards,
        isCardRevealed: (card: Card) =>
          state.matches("pre_game_revealing") ||
          !!state.context.revealedCards.includes(card.id) ||
          !!state.context.tempCards.find((c) => c?.id === card.id)
      };
    }
  );

  useEffect(() => {
    if (isRunning && !timer.started) {
      timer.start();
    }
    if (!isRunning && timer.started) {
      timer.stop();
    }
  }, [isRunning, timer]);

  return {
    tempCards,
    debug,
    isInitialized: game.initialized,
    layout: game.layout,
    isRunning,
    remainingTime: timer.remaining,
    start() {
      gameMachine.send({ type: "start" });
    },
    stop() {
      gameMachine.send({ type: "stop" });
    },
    restart() {
      gameMachine.stop();
      gameMachine.start();
    },
    openCard(card: Card) {
      gameMachine.send({ type: "open_card", card });
    },
    isCardRevealed
  };
}
