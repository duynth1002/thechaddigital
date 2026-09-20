const ElevatorState = Object.freeze({
  IDLE: "IDLE",
  MOVING_UP: "MOVING_UP",
  MOVING_DOWN: "MOVING_DOWN",
  DOOR_OPENING: "DOOR_OPENING",
  DOOR_OPEN: "DOOR_OPEN",
  DOOR_CLOSING: "DOOR_CLOSING",
});

module.exports = { ElevatorState };
