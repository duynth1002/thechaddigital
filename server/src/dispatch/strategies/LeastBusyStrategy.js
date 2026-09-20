const { DispatchStrategy } = require("./DispatchStrategy");

/**
 * Alternate strategy kept to show the Dispatcher is strategy-agnostic:
 * ignore direction and pick the car with the least remaining work,
 * breaking ties by distance then id.
 */
class LeastBusyStrategy extends DispatchStrategy {
  selectElevator(elevators, hallCall) {
    if (!elevators.length) {
      throw new Error("No elevators available to dispatch");
    }

    const floor = hallCall.getFloor();
    return [...elevators].sort((a, b) => {
      const work = a.estimateRemainingWork() - b.estimateRemainingWork();
      if (work !== 0) return work;
      const distance = a.distanceTo(floor) - b.distanceTo(floor);
      if (distance !== 0) return distance;
      return a.getId() - b.getId();
    })[0];
  }
}

module.exports = { LeastBusyStrategy };
