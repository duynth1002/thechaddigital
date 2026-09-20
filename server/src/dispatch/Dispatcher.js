class Dispatcher {
  #strategy;

  constructor(strategy) {
    if (!strategy || typeof strategy.selectElevator !== "function") {
      throw new Error("Dispatcher requires a DispatchStrategy");
    }
    this.#strategy = strategy;
  }

  setStrategy(strategy) {
    if (!strategy || typeof strategy.selectElevator !== "function") {
      throw new Error("Dispatcher requires a DispatchStrategy");
    }
    this.#strategy = strategy;
  }

  getStrategyName() {
    return this.#strategy.constructor.name;
  }

  assign(elevators, hallCall) {
    return this.#strategy.selectElevator(elevators, hallCall);
  }
}

module.exports = { Dispatcher };
