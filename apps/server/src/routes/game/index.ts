import { Socket } from "socket.io";
import { GameController } from "../../controllers/game";
import { safeHandler, schemas } from "../../socket/safeHandler";

export function registerGameRoutes(socket: Socket, controller: GameController) {
    socket.on("game-ready", safeHandler("game-ready", schemas.roomOnly, (data) => controller.handleReady(socket, data)));
    socket.on("game-move", safeHandler("game-move", schemas.move, (data) => controller.handleMove(socket, data)));
}
