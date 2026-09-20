class DispatchStrategy {
  selectElevator(_elevators, _hallCall) {
    throw new Error("selectElevator() must be implemented by subclasses");
  }
}

module.exports = { DispatchStrategy };
