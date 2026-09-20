class SimulationEngine {
  #building;
  #tickMs;
  #timer;
  #listeners;
  #tickCount;

  constructor(building, { tickMs = 100 } = {}) {
    this.#building = building;
    this.#tickMs = tickMs;
    this.#timer = null;
    this.#listeners = new Set();
    this.#tickCount = 0;
  }

  onTick(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  start() {
    if (this.#timer) return;
    this.#timer = setInterval(() => this.tick(), this.#tickMs);
  }

  stop() {
    if (!this.#timer) return;
    clearInterval(this.#timer);
    this.#timer = null;
  }

  isRunning() {
    return this.#timer != null;
  }

  getTickCount() {
    return this.#tickCount;
  }

  tick() {
    this.#tickCount += 1;
    this.#building.step();
    const snapshot = {
      ...this.#building.getSnapshot(),
      tick: this.#tickCount,
    };
    for (const listener of this.#listeners) {
      listener(snapshot);
    }
    return snapshot;
  }
}

module.exports = { SimulationEngine };
