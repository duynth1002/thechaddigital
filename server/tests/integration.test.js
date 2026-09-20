const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { Building } = require("../src/models/Building");
const { Direction } = require("../src/models/Direction");

const FAST = {
  ticksPerFloor: 1,
  ticksDoorOpen: 1,
  ticksDoorTransition: 1,
  startFloor: 1,
  floorCount: 10,
  elevatorCount: 3,
};

function runUntil(building, predicate, maxTicks = 800) {
  for (let i = 0; i < maxTicks; i += 1) {
    building.step();
    if (predicate(building.getSnapshot())) return i + 1;
  }
  throw new Error(
    `Timed out after ${maxTicks} ticks. Last snapshot: ${JSON.stringify(building.getSnapshot())}`
  );
}

describe("Building integration", () => {
  it("dispatches concurrent hall calls across different elevators", () => {
    const building = new Building(FAST);
    const a = building.hallCall(3, Direction.UP);
    const b = building.hallCall(8, Direction.UP);
    const c = building.hallCall(10, Direction.DOWN);

    const assigned = [a.elevatorId, b.elevatorId, c.elevatorId];
    assert.equal(new Set(assigned).size, 3, "each call should get its own car");

    runUntil(building, (snap) => snap.pendingHallCalls.length === 0);

    const floors = building
      .getSnapshot()
      .elevators.map((car) => car.currentFloor)
      .sort((x, y) => x - y);

    assert.deepEqual(floors, [3, 8, 10]);
  });

  it("rejects illegal hall buttons and duplicate pending calls", () => {
    const building = new Building(FAST);
    assert.throws(() => building.hallCall(1, Direction.DOWN), /Bottom floor/);
    assert.throws(() => building.hallCall(10, Direction.UP), /Top floor/);

    const first = building.hallCall(4, Direction.UP);
    const duplicate = building.hallCall(4, Direction.UP);
    assert.equal(first.ignored, false);
    assert.equal(duplicate.ignored, true);
  });

  it("lets a passenger enter via car call after a hall pickup", () => {
    const building = new Building(FAST);
    building.hallCall(2, Direction.UP);

    runUntil(building, (snap) =>
      snap.elevators.some(
        (car) => car.currentFloor === 2 && car.doorState === "OPEN"
      )
    );

    const car = building
      .getSnapshot()
      .elevators.find((item) => item.currentFloor === 2);
    building.carCall(car.id, 9);

    runUntil(building, (snap) =>
      snap.elevators.some(
        (item) => item.id === car.id && item.currentFloor === 9 && item.doorState === "OPEN"
      )
    );

    assert.equal(
      building.getSnapshot().elevators.find((item) => item.id === car.id)
        .currentFloor,
      9
    );
  });
});
