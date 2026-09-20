export function ElevatorCarPanel({
  car,
  floorCount,
  minFloor,
  onCarCall,
  onDoorHold,
  onDoorClose,
  onExit,
}) {
  if (!car) {
    return (
      <aside className="car-panel empty">
        <h2>Inside car</h2>
        <p>
          No passenger inside a car. When a car arrives and the doors open, click
          it to enter.
        </p>
      </aside>
    );
  }

  const maxFloor = minFloor + floorCount - 1;
  const floors = [];
  for (let floor = maxFloor; floor >= minFloor; floor -= 1) {
    floors.push(floor);
  }

  return (
    <aside className="car-panel">
      <div className="car-panel-head">
        <h2>Inside car {car.id}</h2>
        <button type="button" className="ghost" onClick={onExit}>
          Exit
        </button>
      </div>
      <p className="car-meta">
        Floor {car.currentFloor} · {car.direction} · doors {car.doorState}
        {car.doorHold ? " · HOLD" : ""}
      </p>
      <div className="floor-pad">
        {floors.map((floor) => {
          const queued = car.stops.includes(floor);
          return (
            <button
              key={floor}
              type="button"
              className={`pad-btn ${queued ? "queued" : ""} ${car.currentFloor === floor ? "here" : ""}`}
              onClick={() => onCarCall(car.id, floor)}
            >
              {floor}
            </button>
          );
        })}
      </div>
      <div className="door-controls">
        <button type="button" onClick={() => onDoorHold(car.id)}>
          Hold door
        </button>
        <button type="button" onClick={() => onDoorClose(car.id)}>
          Close door
        </button>
      </div>
    </aside>
  );
}
