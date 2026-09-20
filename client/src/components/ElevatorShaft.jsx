function directionGlyph(direction) {
  if (direction === "UP") return "▲";
  if (direction === "DOWN") return "▼";
  return "·";
}

export function ElevatorShaft({ car, floor, active, selected, onEnterCar }) {
  if (!active) {
    return <div className="shaft-cell" />;
  }

  const canEnter = car.doorState === "OPEN" || car.doorState === "OPENING";

  return (
    <div className="shaft-cell occupied">
      <button
        type="button"
        className={`car ${car.doorState.toLowerCase()} ${selected ? "selected" : ""} ${canEnter ? "enterable" : ""}`}
        onClick={() => onEnterCar(car)}
        disabled={!canEnter}
        aria-label={`Elevator ${car.id} at floor ${floor}, doors ${car.doorState}`}
      >
        <span className="car-id">E{car.id}</span>
        <span className="car-dir">{directionGlyph(car.direction)}</span>
        <span className="car-doors" data-state={car.doorState}>
          <i />
          <i />
        </span>
      </button>
    </div>
  );
}
