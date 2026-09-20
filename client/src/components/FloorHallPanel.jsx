export function FloorHallPanel({
  floor,
  minFloor,
  maxFloor,
  pendingHallCalls,
  onHallCall,
}) {
  const upLit = pendingHallCalls.some(
    (call) => call.floor === floor && call.direction === "UP"
  );
  const downLit = pendingHallCalls.some(
    (call) => call.floor === floor && call.direction === "DOWN"
  );

  return (
    <div className="hall-panel">
      {floor < maxFloor ? (
        <button
          type="button"
          className={`hall-btn up ${upLit ? "lit" : ""}`}
          onClick={() => onHallCall(floor, "UP")}
          aria-label={`Call up from floor ${floor}`}
        >
          ▲
        </button>
      ) : (
        <span className="hall-spacer" />
      )}
      {floor > minFloor ? (
        <button
          type="button"
          className={`hall-btn down ${downLit ? "lit" : ""}`}
          onClick={() => onHallCall(floor, "DOWN")}
          aria-label={`Call down from floor ${floor}`}
        >
          ▼
        </button>
      ) : (
        <span className="hall-spacer" />
      )}
    </div>
  );
}
