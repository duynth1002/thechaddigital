const { Request } = require("./Request");
const { Direction } = require("./Direction");

class HallCall extends Request {
  #floor;
  #direction;
  #elevatorId;
  #served;

  constructor(floor, direction) {
    super();
    if (direction !== Direction.UP && direction !== Direction.DOWN) {
      throw new Error(`Hall calls must be UP or DOWN, got ${direction}`);
    }
    this.#floor = floor;
    this.#direction = direction;
    this.#elevatorId = null;
    this.#served = false;
  }

  getFloor() {
    return this.#floor;
  }

  getDirection() {
    return this.#direction;
  }

  getElevatorId() {
    return this.#elevatorId;
  }

  isAssigned() {
    return this.#elevatorId != null;
  }

  isServed() {
    return this.#served;
  }

  assignTo(elevatorId) {
    this.#elevatorId = elevatorId;
  }

  markServed() {
    this.#served = true;
  }

  matches(floor, direction) {
    return this.#floor === floor && this.#direction === direction;
  }

  toJSON() {
    return {
      id: this.getId(),
      type: "hall",
      floor: this.#floor,
      direction: this.#direction,
      elevatorId: this.#elevatorId,
      served: this.#served,
    };
  }
}

module.exports = { HallCall };
