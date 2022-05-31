import { createTestModel } from "@xstate/test";
import { gameLogicMachine } from "../gameMachine";

describe("test", () => {
  const model = createTestModel(gameLogicMachine);
  model.getPaths().forEach((path) => {
    console.log(path.description);
    // it.concurrent(path.description, async () => {

    // })
  });
});
