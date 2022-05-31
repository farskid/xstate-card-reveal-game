import "./styles.css";
import { useEffect, useRef, useState } from "react";
import { assign } from "xstate";
import { useMachine } from "@xstate/react";
import { choose, raise } from "xstate/lib/actions";
import { CardGame, Card } from "./Game";
import { gameLogicMachine } from "./gameMachine";
import cls from "classnames";

export default function App() {
  // const game = useGame({
  //   totalCards: 12,
  //   preGameRevealMs: 1000
  // });

  const { current: game } = useRef(new CardGame({ totalCards: 12 }).init());
  const [state, send] = useMachine(gameLogicMachine, {
    context: {
      totalCards: 12,
      remainingTime: 5,
      tempCards: [], // Card[]
      revealedCards: [] // string[] of card IDs
    },
    delays: {
      GAME_TIME_MS: 30000,
      PRE_GAME_REVEAL_MS: 2000,
      SHOWCASE_MS: 1000,
      SINGLE_CARD_DELAY_MS: 1000
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
      clearContext: assign((ctx) => ({
        revealedCards: [],
        tempCards: [],
        totalCards: ctx.totalCards,
        remainingTime: 5
      })),
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
  });
  const isCardRevealed = (card: Card) =>
    state.matches("pre_game_revealing") ||
    !!state.context.revealedCards.includes(card.id) ||
    !!state.context.tempCards.find((c) => c?.id === card.id);

  return (
    <div className="App">
      <h1>Find matching card</h1>
      <p>{JSON.stringify(state.value)}</p>
      <p>Remaining time: {state.context.remainingTime} seconds</p>
      <button
        onClick={() => {
          send({ type: "start" });
        }}
      >
        Start a new game!
      </button>
      {/* <button
        onClick={() => {
          // game.restart();
        }}
      >
        Restart
      </button> */}
      <div className="matrix">
        {game.layout.map((row, i) => (
          <div key={i} className="row">
            {row.map((cell, ii) => (
              <button
                className={cls("cell", {
                  revealed: isCardRevealed(cell)
                })}
                key={cell.id}
                disabled={isCardRevealed(cell)}
                onClick={() => {
                  send({ type: "open_card", card: cell });
                }}
              >
                <span className="cell-content">
                  {isCardRevealed(cell) ? <p>{cell.value}</p> : "?"}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
