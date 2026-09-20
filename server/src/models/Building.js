const { Elevator } = require("./Elevator");
const { HallCall } = require("./HallCall");
const { CarCall } = require("./CarCall");
const { Direction } = require("./Direction");
const { Dispatcher } = require("../dispatch/Dispatcher");
const { NearestCarStrategy } = require("../dispatch/strategies/NearestCarStrategy");
const { DEFAULT_CONFIG } = require("../config");

class Building {
  #floorCount;
  #minFloor;
  #elevators;
  #dispatcher;
  #pendingHallCalls;

  constructor(options = {}) {
    this.#floorCount = options.floorCount ?? DEFAULT_CONFIG.floorCount;
    this.#minFloor = options.minFloor ?? DEFAULT_CONFIG.minFloor;
    const elevatorCount = options.elevatorCount ?? DEFAULT_CONFIG.elevatorCount;
    const elevatorOptions = {
      floorCount: this.#floorCount,
      minFloor: this.#minFloor,
      ticksPerFloor: options.ticksPerFloor,
      ticksDoorOpen: options.ticksDoorOpen,
      ticksDoorTransition: options.ticksDoorTransition,
      startFloor: options.startFloor,
    };

    this.#elevators = Array.from(
      { length: elevatorCount },
      (_, index) => new Elevator(index + 1, elevatorOptions)
    );
    this.#dispatcher = new Dispatcher(
      options.strategy ?? new NearestCarStrategy()
    );
    this.#pendingHallCalls = [];
  }

  getFloorCount() {
    return this.#floorCount;
  }

  getElevator(id) {
    const elevator = this.#elevators.find((car) => car.getId() === id);
    if (!elevator) throw new Error(`Unknown elevator ${id}`);
    return elevator;
  }

  hallCall(floor, direction) {
    this.#assertHallCall(floor, direction);
    if (this.#hasPendingHallCall(floor, direction)) {
      return { ignored: true, reason: "duplicate" };
    }

    const call = new HallCall(floor, direction);
    const elevator = this.#dispatcher.assign(this.#elevators, call);
    call.assignTo(elevator.getId());
    elevator.assignHallCall(call);
    this.#pendingHallCalls.push(call);
    return { ignored: false, elevatorId: elevator.getId(), call: call.toJSON() };
  }

  carCall(elevatorId, floor) {
    this.#assertFloor(floor);
    const elevator = this.getElevator(elevatorId);
    const call = new CarCall(elevatorId, floor);
    elevator.requestStop(floor);
    return { elevatorId, call: call.toJSON() };
  }

  doorHold(elevatorId) {
    this.getElevator(elevatorId).holdDoors();
  }

  doorClose(elevatorId) {
    this.getElevator(elevatorId).closeDoors();
  }

  step() {
    const served = [];
    for (const elevator of this.#elevators) {
      served.push(...elevator.step());
    }
    if (served.length > 0) {
      const servedIds = new Set(served.map((call) => call.getId()));
      this.#pendingHallCalls = this.#pendingHallCalls.filter(
        (call) => !servedIds.has(call.getId())
      );
    }
    return served;
  }

  getSnapshot() {
    return {
      floors: this.#floorCount,
      minFloor: this.#minFloor,
      strategy: this.#dispatcher.getStrategyName(),
      elevators: this.#elevators.map((elevator) => elevator.getSnapshot()),
      pendingHallCalls: this.#pendingHallCalls.map((call) => call.toJSON()),
    };
  }

  setStrategy(strategy) {
    this.#dispatcher.setStrategy(strategy);
  }

  #hasPendingHallCall(floor, direction) {
    return this.#pendingHallCalls.some((call) => call.matches(floor, direction));
  }

  #assertFloor(floor) {
    const maxFloor = this.#minFloor + this.#floorCount - 1;
    if (floor < this.#minFloor || floor > maxFloor) {
      throw new Error(`Floor ${floor} is out of range ${this.#minFloor}-${maxFloor}`);
    }
  }

  #assertHallCall(floor, direction) {
    this.#assertFloor(floor);
    const maxFloor = this.#minFloor + this.#floorCount - 1;
    if (direction !== Direction.UP && direction !== Direction.DOWN) {
      throw new Error(`Invalid hall direction ${direction}`);
    }
    if (direction === Direction.UP && floor === maxFloor) {
      throw new Error("Top floor has no Up hall button");
    }
    if (direction === Direction.DOWN && floor === this.#minFloor) {
      throw new Error("Bottom floor has no Down hall button");
    }
  }
}

module.exports = { Building };
