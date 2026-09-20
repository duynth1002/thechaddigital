const { Elevator } = require("../src/models/Elevator");
const { HallCall } = require("../src/models/HallCall");
const { Direction } = require("../src/models/Direction");
const { ElevatorState } = require("../src/models/ElevatorState");

const FAST = {
  ticksPerFloor: 1,
  ticksDoorOpen: 1,
  ticksDoorTransition: 1,
  startFloor: 1,
  floorCount: 10,
};

function runUntil(elevator, predicate, maxTicks = 500) {
  for (let i = 0; i < maxTicks; i += 1) {
    elevator.step();
    if (predicate(elevator.getSnapshot())) return i + 1;
  }
  throw new Error(
    `Timed out after ${maxTicks} ticks. Last snapshot: ${JSON.stringify(elevator.getSnapshot())}`
  );
}

module.exports = { Elevator, HallCall, Direction, ElevatorState, FAST, runUntil };
