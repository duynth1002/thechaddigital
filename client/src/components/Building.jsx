import { FloorHallPanel } from "./FloorHallPanel";
import { ElevatorShaft } from "./ElevatorShaft";

export function Building({ state, onHallCall, onEnterCar, enteredCarId }) {
  const maxFloor = state.minFloor + state.floors - 1;
  const floors = [];
  for (let floor = maxFloor; floor >= state.minFloor; floor -= 1) {
    floors.push(floor);
  }

  return (
    <div className="building">
      <div
        className="building-grid"
        style={{
          gridTemplateColumns: `72px 88px repeat(${state.elevators.length}, 1fr)`,
        }}
      >
        <div className="col-head">Lvl</div>
        <div className="col-head">Hall</div>
        {state.elevators.map((car) => (
          <div className="col-head" key={car.id}>
            Car {car.id}
          </div>
        ))}

        {floors.map((floor) => (
          <FloorRow
            key={floor}
            floor={floor}
            minFloor={state.minFloor}
            maxFloor={maxFloor}
            elevators={state.elevators}
            pendingHallCalls={state.pendingHallCalls}
            onHallCall={onHallCall}
            onEnterCar={onEnterCar}
            enteredCarId={enteredCarId}
          />
        ))}
      </div>
    </div>
  );
}

function FloorRow({
  floor,
  minFloor,
  maxFloor,
  elevators,
  pendingHallCalls,
  onHallCall,
  onEnterCar,
  enteredCarId,
}) {
  return (
    <>
      <div className="floor-label">{String(floor).padStart(2, "0")}</div>
      <FloorHallPanel
        floor={floor}
        minFloor={minFloor}
        maxFloor={maxFloor}
        pendingHallCalls={pendingHallCalls}
        onHallCall={onHallCall}
      />
      {elevators.map((car) => (
        <ElevatorShaft
          key={car.id}
          car={car}
          floor={floor}
          active={car.currentFloor === floor}
          selected={enteredCarId === car.id}
          onEnterCar={onEnterCar}
        />
      ))}
    </>
  );
}
