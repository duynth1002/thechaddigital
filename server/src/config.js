const DEFAULT_CONFIG = Object.freeze({
  floorCount: 10,
  elevatorCount: 3,
  tickMs: 100,
  ticksPerFloor: 10,
  ticksDoorOpen: 40,
  ticksDoorTransition: 5,
  minFloor: 1,
});

function createConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}

module.exports = { DEFAULT_CONFIG, createConfig };
