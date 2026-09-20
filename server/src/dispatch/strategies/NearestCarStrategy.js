const { DispatchStrategy } = require("./DispatchStrategy");

/**
 * Simplified nearest-car / LOOK scorer.
 *
 * Lower score wins:
 *   0xxx  idle car already at the call floor
 *   1xxx  car already traveling toward the call in the same direction
 *   2xxx  idle car, scored by distance
 *   3xxx  busy going the other way — pick whoever frees up soonest
 */
class NearestCarStrategy extends DispatchStrategy {
  selectElevator(elevators, hallCall) {
    if (!elevators.length) {
      throw new Error("No elevators available to dispatch");
    }

    let best = elevators[0];
    let bestScore = this.#score(best, hallCall);

    for (let i = 1; i < elevators.length; i += 1) {
      const elevator = elevators[i];
      const score = this.#score(elevator, hallCall);
      if (score < bestScore) {
        best = elevator;
        bestScore = score;
      }
    }

    return best;
  }

  #score(elevator, hallCall) {
    const floor = hallCall.getFloor();
    const direction = hallCall.getDirection();
    const idTieBreak = elevator.getId() * 0.01;

    if (elevator.isIdle() && elevator.distanceTo(floor) === 0) {
      return 100 + idTieBreak;
    }
    if (elevator.willPass(floor, direction)) {
      return 1000 + elevator.distanceTo(floor) + idTieBreak;
    }
    if (elevator.isIdle()) {
      return 2000 + elevator.distanceTo(floor) + idTieBreak;
    }
    return 3000 + elevator.estimateRemainingWork() + idTieBreak;
  }
}

module.exports = { NearestCarStrategy };
