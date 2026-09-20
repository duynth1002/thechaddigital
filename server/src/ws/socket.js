function attachSocket(io, building) {
  io.on("connection", (socket) => {
    socket.emit("state", building.getSnapshot());

    socket.on("hallCall", ({ floor, direction } = {}) => {
      try {
        building.hallCall(Number(floor), direction);
        socket.emit("ack", { ok: true, type: "hallCall" });
      } catch (error) {
        socket.emit("error", { type: "hallCall", message: error.message });
      }
    });

    socket.on("carCall", ({ elevatorId, floor } = {}) => {
      try {
        building.carCall(Number(elevatorId), Number(floor));
        socket.emit("ack", { ok: true, type: "carCall" });
      } catch (error) {
        socket.emit("error", { type: "carCall", message: error.message });
      }
    });

    socket.on("doorHold", ({ elevatorId } = {}) => {
      try {
        building.doorHold(Number(elevatorId));
        socket.emit("ack", { ok: true, type: "doorHold" });
      } catch (error) {
        socket.emit("error", { type: "doorHold", message: error.message });
      }
    });

    socket.on("doorClose", ({ elevatorId } = {}) => {
      try {
        building.doorClose(Number(elevatorId));
        socket.emit("ack", { ok: true, type: "doorClose" });
      } catch (error) {
        socket.emit("error", { type: "doorClose", message: error.message });
      }
    });
  });
}

module.exports = { attachSocket };
