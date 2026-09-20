const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { Elevator } = require("../src/models/Elevator");
const { HallCall } = require("../src/models/HallCall");
const { Direction } = require("../src/models/Direction");
const { Dispatcher } = require("../src/dispatch/Dispatcher");
const { NearestCarStrategy } = require("../src/dispatch/strategies/NearestCarStrategy");
const { LeastBusyStrategy } = require("../src/dispatch/strategies/LeastBusyStrategy");
const { DispatchStrategy } = require("../src/dispatch/strategies/DispatchStrategy");
const { FAST } = require("./helpers");

function makeElevators(floors) {
  return floors.map(
    (floor, index) =>
      new Elevator(index + 1, { ...FAST, startFloor: floor })
  );
}

describe("Dispatcher + NearestCarStrategy", () => {
  it("depends on the strategy interface, not a concrete class", () => {
    const dispatcher = new Dispatcher(new NearestCarStrategy());
    assert.equal(dispatcher.getStrategyName(), "NearestCarStrategy");
    dispatcher.setStrategy(new LeastBusyStrategy());
    assert.equal(dispatcher.getStrategyName(), "LeastBusyStrategy");
  });

  it("rejects a missing strategy", () => {
    assert.throws(() => new Dispatcher(null), /DispatchStrategy/);
    assert.throws(
      () => new DispatchStrategy().selectElevator([], null),
      /must be implemented/
    );
  });

  it("assigns an idle car already at the call floor", () => {
    const elevators = makeElevators([1, 5, 9]);
    const dispatcher = new Dispatcher(new NearestCarStrategy());
    const chosen = dispatcher.assign(
      elevators,
      new HallCall(5, Direction.UP)
    );
    assert.equal(chosen.getId(), 2);
  });

  it("prefers a nearer idle car when none is already there", () => {
    const elevators = makeElevators([1, 2, 9]);
    const dispatcher = new Dispatcher(new NearestCarStrategy());
    const chosen = dispatcher.assign(
      elevators,
      new HallCall(4, Direction.UP)
    );
    assert.equal(chosen.getId(), 2);
  });

  it("prefers a car already traveling toward the call in the same direction over a farther idle car", () => {
    const moving = new Elevator(1, { ...FAST, startFloor: 2 });
    moving.requestStop(10);
    moving.step();
    const idleNearTop = new Elevator(2, { ...FAST, startFloor: 10 });
    const idleFar = new Elevator(3, { ...FAST, startFloor: 1 });

    const dispatcher = new Dispatcher(new NearestCarStrategy());
    const chosen = dispatcher.assign(
      [moving, idleNearTop, idleFar],
      new HallCall(6, Direction.UP)
    );
    assert.equal(chosen.getId(), 1);
    assert.equal(moving.willPass(6, Direction.UP), true);
  });

  it("does not treat an up-bound car as able to pick up a down call it will pass", () => {
    const moving = new Elevator(1, { ...FAST, startFloor: 2 });
    moving.requestStop(10);
    const idle = new Elevator(2, { ...FAST, startFloor: 4 });
    const other = new Elevator(3, { ...FAST, startFloor: 1 });

    assert.equal(moving.willPass(5, Direction.DOWN), false);

    const dispatcher = new Dispatcher(new NearestCarStrategy());
    const chosen = dispatcher.assign(
      [moving, idle, other],
      new HallCall(5, Direction.DOWN)
    );
    assert.equal(chosen.getId(), 2);
  });

  it("falls back to the car that will free up soonest when all are busy the wrong way", () => {
    const a = new Elevator(1, { ...FAST, startFloor: 8 });
    a.requestStop(2);
    const b = new Elevator(2, { ...FAST, startFloor: 9 });
    b.requestStop(3);
    b.requestStop(1);
    const c = new Elevator(3, { ...FAST, startFloor: 10 });
    c.requestStop(4);
    c.requestStop(2);
    c.requestStop(1);

    const dispatcher = new Dispatcher(new NearestCarStrategy());
    const chosen = dispatcher.assign(
      [a, b, c],
      new HallCall(9, Direction.UP)
    );
    assert.equal(chosen.getId(), 1);
  });
});
