const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  Elevator,
  HallCall,
  Direction,
  ElevatorState,
  FAST,
  runUntil,
} = require("./helpers");

describe("Elevator.requestStop", () => {
  it("queues a destination above the car and starts moving up", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(8);
    const snap = elevator.getSnapshot();
    assert.equal(snap.direction, Direction.UP);
    assert.equal(snap.state, ElevatorState.MOVING_UP);
    assert.deepEqual(snap.upStops, [8]);
  });

  it("queues a destination below the car and starts moving down", () => {
    const elevator = new Elevator(1, { ...FAST, startFloor: 9 });
    elevator.requestStop(2);
    const snap = elevator.getSnapshot();
    assert.equal(snap.direction, Direction.DOWN);
    assert.equal(snap.state, ElevatorState.MOVING_DOWN);
    assert.deepEqual(snap.downStops, [2]);
  });

  it("opens doors when the requested floor is the current idle floor", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(1);
    assert.equal(elevator.getSnapshot().state, ElevatorState.DOOR_OPENING);
  });

  it("arrives and opens at the requested car-call floor", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(4);
    runUntil(
      elevator,
      (snap) => snap.currentFloor === 4 && snap.state === ElevatorState.DOOR_OPEN
    );
    const snap = elevator.getSnapshot();
    assert.equal(snap.currentFloor, 4);
    assert.equal(snap.state, ElevatorState.DOOR_OPEN);
    assert.ok(!snap.stops.includes(4));
  });

  it("holdDoors keeps the door open past the auto-close timer", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(1);
    runUntil(elevator, (snap) => snap.state === ElevatorState.DOOR_OPEN);
    elevator.holdDoors();
    elevator.step();
    elevator.step();
    elevator.step();
    assert.equal(elevator.getSnapshot().state, ElevatorState.DOOR_OPEN);
    assert.equal(elevator.getSnapshot().doorHold, true);
  });

  it("closeDoors closes immediately even while held", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(1);
    runUntil(elevator, (snap) => snap.state === ElevatorState.DOOR_OPEN);
    elevator.holdDoors();
    elevator.closeDoors();
    assert.equal(elevator.getSnapshot().state, ElevatorState.DOOR_CLOSING);
  });
});

describe("directional pickup rule", () => {
  it("stops for an UP hall call while traveling 1→10", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(10);
    runUntil(elevator, (snap) => snap.currentFloor === 3);

    elevator.assignHallCall(new HallCall(5, Direction.UP));

    const floorsOpened = new Set();
    for (let i = 0; i < 80; i += 1) {
      elevator.step();
      const snap = elevator.getSnapshot();
      if (
        snap.state === ElevatorState.DOOR_OPENING ||
        snap.state === ElevatorState.DOOR_OPEN
      ) {
        floorsOpened.add(snap.currentFloor);
      }
      if (snap.currentFloor === 10 && floorsOpened.has(5)) break;
    }

    assert.ok(floorsOpened.has(5), "should have opened at 5 for the up call");
    assert.ok(floorsOpened.has(10), "should still continue to 10");
  });

  it("does not stop for a DOWN hall call at an intermediate floor while going 1→10; picks it up after reversing", () => {
    const elevator = new Elevator(1, FAST);
    elevator.requestStop(10);
    runUntil(elevator, (snap) => snap.currentFloor === 3);

    const downCall = new HallCall(5, Direction.DOWN);
    elevator.assignHallCall(downCall);

    let openedAt5WhileGoingUp = false;
    let openedAt5GoingDown = false;
    let reachedTen = false;

    for (let i = 0; i < 200; i += 1) {
      elevator.step();
      const snap = elevator.getSnapshot();
      const doorsOpen =
        snap.state === ElevatorState.DOOR_OPENING ||
        snap.state === ElevatorState.DOOR_OPEN;

      if (snap.currentFloor === 10) reachedTen = true;

      if (doorsOpen && snap.currentFloor === 5) {
        if (!reachedTen && snap.direction === Direction.UP) {
          openedAt5WhileGoingUp = true;
        }
        if (reachedTen && snap.direction === Direction.DOWN) {
          openedAt5GoingDown = true;
        }
      }
      if (openedAt5GoingDown && downCall.isServed()) break;
    }

    assert.equal(
      openedAt5WhileGoingUp,
      false,
      "must not stop at 5 for a down call on the way up"
    );
    assert.equal(reachedTen, true, "must continue to the topmost target");
    assert.equal(
      openedAt5GoingDown,
      true,
      "must pick up the down call after reversing"
    );
    assert.equal(downCall.isServed(), true);
  });
});
