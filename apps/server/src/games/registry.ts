import { rpsGameHandler } from "./rps";
import { snakeLadderGameHandler } from "./snake-ladder";
import { ticTacToeGameHandler } from "./tic-tac-toe";
import { GameRegistry } from "../models";

export const gameRegistry: Record<string, GameRegistry> = {
    RPS: rpsGameHandler as unknown as GameRegistry,
    SNAKE_LADDER: snakeLadderGameHandler as unknown as GameRegistry,
    TIC_TAC_TOE: ticTacToeGameHandler as unknown as GameRegistry,
};
