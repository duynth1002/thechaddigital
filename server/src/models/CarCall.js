const { Request } = require("./Request");

class CarCall extends Request {
  #floor;
  #elevatorId;

  constructor(elevatorId, floor) {
    super();
    this.#elevatorId = elevatorId;
    this.#floor = floor;
  }

  getFloor() {
    return this.#floor;
  }

  getElevatorId() {
    return this.#elevatorId;
  }

  toJSON() {
    return {
      id: this.getId(),
      type: "car",
      floor: this.#floor,
      elevatorId: this.#elevatorId,
    };
  }
}

module.exports = { CarCall };
