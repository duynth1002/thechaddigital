const { Direction } = require("./Direction");
const { ElevatorState } = require("./ElevatorState");
const { DEFAULT_CONFIG } = require("../config");

class Elevator {
  #id;
  #minFloor;
  #maxFloor;
  #currentFloor;
  #state;
  #direction;
  #upStops;
  #downStops;
  #hallCalls;
  #doorHold;
  #moveTicksRemaining;
  #doorOpenTicksRemaining;
  #transitionTicksRemaining;
  #ticksPerFloor;
  #ticksDoorOpen;
  #ticksDoorTransition;

  constructor(id, options = {}) {
    this.#id = id;
    this.#minFloor = options.minFloor ?? DEFAULT_CONFIG.minFloor;
    this.#maxFloor = options.floorCount ?? DEFAULT_CONFIG.floorCount;
    this.#currentFloor = options.startFloor ?? this.#minFloor;
    this.#state = ElevatorState.IDLE;
    this.#direction = Direction.IDLE;
    this.#upStops = new Set();
    this.#downStops = new Set();
    this.#hallCalls = [];
    this.#doorHold = false;
    this.#moveTicksRemaining = 0;
    this.#doorOpenTicksRemaining = 0;
    this.#transitionTicksRemaining = 0;
    this.#ticksPerFloor = options.ticksPerFloor ?? DEFAULT_CONFIG.ticksPerFloor;
    this.#ticksDoorOpen = options.ticksDoorOpen ?? DEFAULT_CONFIG.ticksDoorOpen;
    this.#ticksDoorTransition =
      options.ticksDoorTransition ?? DEFAULT_CONFIG.ticksDoorTransition;
  }

  getId() {
    return this.#id;
  }

  isIdle() {
    return this.#state === ElevatorState.IDLE && !this.#hasAnyStops();
  }

  distanceTo(floor) {
    return Math.abs(this.#currentFloor - floor);
  }

  /**
   * True when this car is already traveling in `callDirection` and its
   * remaining path will pass `floor` (so the call can be picked up en route).
   */
  willPass(floor, callDirection) {
    if (this.#direction !== callDirection) return false;
    if (this.#isDoorCycle()) return false;

    if (callDirection === Direction.UP) {
      return this.#currentFloor <= floor && this.#highestStop() >= floor;
    }
    if (callDirection === Direction.DOWN) {
      return this.#currentFloor >= floor && this.#lowestStop() <= floor;
    }
    return false;
  }

  estimateRemainingWork() {
    if (!this.#hasAnyStops()) {
      return this.#isDoorCycle() ? 1 : 0;
    }
    const floors = [...this.#upStops, ...this.#downStops, this.#currentFloor];
    const span = Math.max(...floors) - Math.min(...floors);
    return span + this.#upStops.size + this.#downStops.size;
  }

  requestStop(floor) {
    this.#assertFloor(floor);
    if (floor === this.#currentFloor) {
      if (this.#isDoorOpenish()) return;
      if (this.#state === ElevatorState.IDLE) {
        this.#beginStop();
      }
      return;
    }
    if (floor > this.#currentFloor) this.#upStops.add(floor);
    else this.#downStops.add(floor);
    this.#wake();
  }

  assignHallCall(hallCall) {
    const floor = hallCall.getFloor();
    const direction = hallCall.getDirection();
    this.#assertFloor(floor);
    if (direction === Direction.UP) this.#upStops.add(floor);
    else this.#downStops.add(floor);
    this.#hallCalls.push(hallCall);
    this.#wake();
  }

  holdDoors() {
    if (!this.#isDoorOpenish()) return;
    this.#doorHold = true;
    this.#doorOpenTicksRemaining = this.#ticksDoorOpen;
    if (this.#state === ElevatorState.DOOR_OPENING) return;
    this.#state = ElevatorState.DOOR_OPEN;
  }

  closeDoors() {
    if (
      this.#state !== ElevatorState.DOOR_OPEN &&
      this.#state !== ElevatorState.DOOR_OPENING
    ) {
      return;
    }
    this.#doorHold = false;
    this.#startClosing();
  }

  openDoors() {
    if (this.#state !== ElevatorState.IDLE && !this.#isMoving()) return;
    this.#beginStop();
  }

  step() {
    const served = [];
    switch (this.#state) {
      case ElevatorState.IDLE:
        this.#planNext();
        break;
      case ElevatorState.MOVING_UP:
      case ElevatorState.MOVING_DOWN:
        this.#tickMove();
        break;
      case ElevatorState.DOOR_OPENING:
        this.#transitionTicksRemaining -= 1;
        if (this.#transitionTicksRemaining <= 0) {
          this.#state = ElevatorState.DOOR_OPEN;
          this.#doorOpenTicksRemaining = this.#ticksDoorOpen;
          served.push(...this.#onDoorsOpened());
        }
        break;
      case ElevatorState.DOOR_OPEN:
        if (!this.#doorHold) {
          this.#doorOpenTicksRemaining -= 1;
          if (this.#doorOpenTicksRemaining <= 0) {
            this.#startClosing();
          }
        }
        break;
      case ElevatorState.DOOR_CLOSING:
        this.#transitionTicksRemaining -= 1;
        if (this.#transitionTicksRemaining <= 0) {
          this.#doorHold = false;
          this.#planNext();
        }
        break;
      default:
        break;
    }
    return served;
  }

  getSnapshot() {
    return {
      id: this.#id,
      currentFloor: this.#currentFloor,
      direction: this.#direction,
      state: this.#state,
      doorState: this.#doorStateLabel(),
      stops: [...this.#upStops, ...this.#downStops].sort((a, b) => a - b),
      upStops: [...this.#upStops].sort((a, b) => a - b),
      downStops: [...this.#downStops].sort((a, b) => a - b),
      assignedHallCalls: this.#hallCalls.map((call) => call.toJSON()),
      doorHold: this.#doorHold,
    };
  }

  #wake() {
    if (this.#state === ElevatorState.IDLE) {
      this.#planNext();
    }
  }

  #tickMove() {
    this.#moveTicksRemaining -= 1;
    if (this.#moveTicksRemaining > 0) return;

    if (this.#state === ElevatorState.MOVING_UP) {
      if (this.#currentFloor < this.#maxFloor) this.#currentFloor += 1;
    } else if (this.#currentFloor > this.#minFloor) {
      this.#currentFloor -= 1;
    }

    this.#moveTicksRemaining = this.#ticksPerFloor;
    this.#onArrivedAtFloor();
  }

  #onArrivedAtFloor() {
    if (this.#shouldStopHere()) {
      this.#beginStop();
      return;
    }

    if (this.#hasWorkAheadInCurrentDirection()) {
      return;
    }

    if (this.#hasWorkInOppositeDirection() || this.#hasOppositeStopHere()) {
      this.#reverse();
      if (this.#shouldStopHere()) {
        this.#beginStop();
        return;
      }
      this.#enterMoving(this.#direction);
      return;
    }

    this.#goIdle();
  }

  #shouldStopHere() {
    const floor = this.#currentFloor;
    if (this.#direction === Direction.UP) {
      if (this.#upStops.has(floor)) return true;
      return this.#downStops.has(floor) && !this.#hasStopsAbove(floor);
    }
    if (this.#direction === Direction.DOWN) {
      if (this.#downStops.has(floor)) return true;
      return this.#upStops.has(floor) && !this.#hasStopsBelow(floor);
    }
    return this.#upStops.has(floor) || this.#downStops.has(floor);
  }

  #beginStop() {
    if (
      this.#direction === Direction.UP &&
      !this.#upStops.has(this.#currentFloor) &&
      this.#downStops.has(this.#currentFloor)
    ) {
      this.#direction = Direction.DOWN;
    } else if (
      this.#direction === Direction.DOWN &&
      !this.#downStops.has(this.#currentFloor) &&
      this.#upStops.has(this.#currentFloor)
    ) {
      this.#direction = Direction.UP;
    } else if (this.#direction === Direction.IDLE) {
      if (this.#upStops.has(this.#currentFloor)) this.#direction = Direction.UP;
      else if (this.#downStops.has(this.#currentFloor)) {
        this.#direction = Direction.DOWN;
      }
    }

    this.#state = ElevatorState.DOOR_OPENING;
    this.#transitionTicksRemaining = this.#ticksDoorTransition;
  }

  #onDoorsOpened() {
    const floor = this.#currentFloor;
    const served = [];

    if (this.#direction === Direction.UP) this.#upStops.delete(floor);
    else if (this.#direction === Direction.DOWN) this.#downStops.delete(floor);
    else {
      this.#upStops.delete(floor);
      this.#downStops.delete(floor);
    }

    this.#hallCalls = this.#hallCalls.filter((call) => {
      if (
        call.getFloor() === floor &&
        (call.getDirection() === this.#direction ||
          this.#direction === Direction.IDLE)
      ) {
        call.markServed();
        served.push(call);
        return false;
      }
      return true;
    });

    return served;
  }

  #startClosing() {
    this.#state = ElevatorState.DOOR_CLOSING;
    this.#transitionTicksRemaining = this.#ticksDoorTransition;
  }

  #planNext() {
    if (this.#shouldStopHere()) {
      this.#beginStop();
      return;
    }

    const above = this.#hasStopsAbove();
    const below = this.#hasStopsBelow();

    if (this.#direction === Direction.UP) {
      if (above) {
        this.#enterMoving(Direction.UP);
        return;
      }
      if (below || this.#downStops.has(this.#currentFloor)) {
        this.#direction = Direction.DOWN;
        if (this.#shouldStopHere()) this.#beginStop();
        else this.#enterMoving(Direction.DOWN);
        return;
      }
      this.#goIdle();
      return;
    }

    if (this.#direction === Direction.DOWN) {
      if (below) {
        this.#enterMoving(Direction.DOWN);
        return;
      }
      if (above || this.#upStops.has(this.#currentFloor)) {
        this.#direction = Direction.UP;
        if (this.#shouldStopHere()) this.#beginStop();
        else this.#enterMoving(Direction.UP);
        return;
      }
      this.#goIdle();
      return;
    }

    if (above && !below) {
      this.#enterMoving(Direction.UP);
      return;
    }
    if (below && !above) {
      this.#enterMoving(Direction.DOWN);
      return;
    }
    if (above && below) {
      const upDist = this.#nearestAbove() - this.#currentFloor;
      const downDist = this.#currentFloor - this.#nearestBelow();
      this.#enterMoving(upDist <= downDist ? Direction.UP : Direction.DOWN);
      return;
    }

    this.#goIdle();
  }

  #enterMoving(direction) {
    this.#direction = direction;
    this.#state =
      direction === Direction.UP
        ? ElevatorState.MOVING_UP
        : ElevatorState.MOVING_DOWN;
    this.#moveTicksRemaining = this.#ticksPerFloor;
  }

  #reverse() {
    this.#direction =
      this.#direction === Direction.UP ? Direction.DOWN : Direction.UP;
    this.#state =
      this.#direction === Direction.UP
        ? ElevatorState.MOVING_UP
        : ElevatorState.MOVING_DOWN;
  }

  #goIdle() {
    this.#direction = Direction.IDLE;
    this.#state = ElevatorState.IDLE;
    this.#moveTicksRemaining = 0;
  }

  #hasAnyStops() {
    return this.#upStops.size > 0 || this.#downStops.size > 0;
  }

  #hasStopsAbove(floor = this.#currentFloor) {
    for (const stop of this.#upStops) if (stop > floor) return true;
    for (const stop of this.#downStops) if (stop > floor) return true;
    return false;
  }

  #hasStopsBelow(floor = this.#currentFloor) {
    for (const stop of this.#upStops) if (stop < floor) return true;
    for (const stop of this.#downStops) if (stop < floor) return true;
    return false;
  }

  #hasWorkAheadInCurrentDirection() {
    if (this.#direction === Direction.UP) return this.#hasStopsAbove();
    if (this.#direction === Direction.DOWN) return this.#hasStopsBelow();
    return false;
  }

  #hasWorkInOppositeDirection() {
    if (this.#direction === Direction.UP) return this.#hasStopsBelow();
    if (this.#direction === Direction.DOWN) return this.#hasStopsAbove();
    return this.#hasAnyStops();
  }

  #hasOppositeStopHere() {
    if (this.#direction === Direction.UP) {
      return this.#downStops.has(this.#currentFloor);
    }
    if (this.#direction === Direction.DOWN) {
      return this.#upStops.has(this.#currentFloor);
    }
    return false;
  }

  #highestStop() {
    const stops = [...this.#upStops, ...this.#downStops];
    if (stops.length === 0) return this.#currentFloor;
    return Math.max(...stops);
  }

  #lowestStop() {
    const stops = [...this.#upStops, ...this.#downStops];
    if (stops.length === 0) return this.#currentFloor;
    return Math.min(...stops);
  }

  #nearestAbove() {
    const above = [...this.#upStops, ...this.#downStops].filter(
      (floor) => floor > this.#currentFloor
    );
    return Math.min(...above);
  }

  #nearestBelow() {
    const below = [...this.#upStops, ...this.#downStops].filter(
      (floor) => floor < this.#currentFloor
    );
    return Math.max(...below);
  }

  #isMoving() {
    return (
      this.#state === ElevatorState.MOVING_UP ||
      this.#state === ElevatorState.MOVING_DOWN
    );
  }

  #isDoorCycle() {
    return (
      this.#state === ElevatorState.DOOR_OPENING ||
      this.#state === ElevatorState.DOOR_OPEN ||
      this.#state === ElevatorState.DOOR_CLOSING
    );
  }

  #isDoorOpenish() {
    return (
      this.#state === ElevatorState.DOOR_OPEN ||
      this.#state === ElevatorState.DOOR_OPENING
    );
  }

  #doorStateLabel() {
    if (this.#state === ElevatorState.DOOR_OPENING) return "OPENING";
    if (this.#state === ElevatorState.DOOR_OPEN) return "OPEN";
    if (this.#state === ElevatorState.DOOR_CLOSING) return "CLOSING";
    return "CLOSED";
  }

  #assertFloor(floor) {
    if (floor < this.#minFloor || floor > this.#maxFloor) {
      throw new Error(
        `Floor ${floor} is out of range ${this.#minFloor}-${this.#maxFloor}`
      );
    }
  }
}

module.exports = { Elevator };
