function directionGlyph(direction) {
  if (direction === "UP") return "▲";
  if (direction === "DOWN") return "▼";
  return "IDLE";
}

export function StatusBar({ state }) {
  return (
    <section className="status-bar">
      {state.elevators.map((car) => (
        <article key={car.id} className="status-card">
          <header>
            <strong>Car {car.id}</strong>
            <span className={`pill ${car.doorState.toLowerCase()}`}>
              {car.doorState}
            </span>
          </header>
          <p className="readout">
            <span>{String(car.currentFloor).padStart(2, "0")}</span>
            <small>{directionGlyph(car.direction)}</small>
          </p>
          <p className="stops">
            {car.stops.length ? `Stops ${car.stops.join(" · ")}` : "No stops"}
          </p>
        </article>
      ))}
      <article className="status-card calls">
        <header>
          <strong>Hall queue</strong>
          <span className="pill">{state.pendingHallCalls.length}</span>
        </header>
        <ul>
          {state.pendingHallCalls.length === 0 ? (
            <li>Clear</li>
          ) : (
            state.pendingHallCalls.map((call) => (
              <li key={call.id}>
                F{call.floor} {call.direction} → E{call.elevatorId}
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
