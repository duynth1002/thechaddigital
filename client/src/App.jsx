import { useState } from "react";
import { useElevatorSocket } from "./hooks/useElevatorSocket";
import { Building } from "./components/Building";
import { ElevatorCarPanel } from "./components/ElevatorCarPanel";
import { StatusBar } from "./components/StatusBar";
import "./App.css";

export default function App() {
  const { state, connected, lastError, hallCall, carCall, doorHold, doorClose } =
    useElevatorSocket();
  const [enteredCarId, setEnteredCarId] = useState(null);

  const enteredCar = state?.elevators?.find((car) => car.id === enteredCarId);

  function handleEnterCar(car) {
    if (car.doorState === "OPEN" || car.doorState === "OPENING") {
      setEnteredCarId(car.id);
    }
  }

  function handleExitCar() {
    setEnteredCarId(null);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="kicker">The Chad Digital · Building 10</p>
          <h1>Elevator Control Board</h1>
        </div>
        <div className={`link-pill ${connected ? "ok" : "down"}`}>
          {connected ? "Live link" : "Disconnected"}
        </div>
      </header>

      {lastError ? <p className="banner error">{lastError}</p> : null}

      {!state ? (
        <p className="banner">Waiting for simulator state…</p>
      ) : (
        <>
          <StatusBar state={state} />
          <div className="workspace">
            <Building
              state={state}
              onHallCall={hallCall}
              onEnterCar={handleEnterCar}
              enteredCarId={enteredCarId}
            />
            <ElevatorCarPanel
              car={enteredCar}
              floorCount={state.floors}
              minFloor={state.minFloor}
              onCarCall={carCall}
              onDoorHold={doorHold}
              onDoorClose={doorClose}
              onExit={handleExitCar}
            />
          </div>
          <p className="hint">
            Press a hall button to call a car. When doors open, click that car to
            step inside and pick a destination.
          </p>
        </>
      )}
    </div>
  );
}
