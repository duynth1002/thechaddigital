const Direction = Object.freeze({
  UP: "UP",
  DOWN: "DOWN",
  IDLE: "IDLE",
});

function oppositeDirection(direction) {
  if (direction === Direction.UP) return Direction.DOWN;
  if (direction === Direction.DOWN) return Direction.UP;
  return Direction.IDLE;
}

module.exports = { Direction, oppositeDirection };
