import { Socket } from "socket.io";
import { RoomController } from "../../controllers/room";
import { safeHandler, schemas, tokenBucket } from "../../socket/safeHandler";

export function registerRoomRoutes(socket: Socket, controller: RoomController) {
    // Shared by create and join so a socket can't spam new rooms or seat hops.
    const allowRoomChange = tokenBucket(10, 60 * 1000);

    socket.on("create-room", safeHandler("create-room", schemas.createRoom, (data, ack) => controller.createRoom(socket, data, ack), allowRoomChange));
    socket.on("join-room", safeHandler("join-room", schemas.joinRoom, (data, ack) => controller.joinRoom(socket, data, ack), allowRoomChange));
    socket.on("leave-room", safeHandler("leave-room", schemas.roomOnly, (data) => controller.leaveRoom(socket, data)));
    socket.on("extend-room", safeHandler("extend-room", schemas.roomOnly, (data, ack) => controller.extendRoom(socket, data, ack)));
    socket.on("get-public-rooms", safeHandler("get-public-rooms", schemas.none, (_data, ack) => controller.getPublicRooms(socket, ack)));
}
