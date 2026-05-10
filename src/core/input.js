export function createInputState() {
  return {
    keys: new Set(),
    cameraMode: 1,
    sideCameraIndex: 0,
    lightingEnabled: true,
    fogEnabled: false,
  };
}

export function setupInput(input) {
  window.addEventListener("keydown", (event) => {
    input.keys.add(event.code);

    if (event.code === "Digit1") {
      input.cameraMode = 1;
    }

    if (event.code === "Digit2") {
      input.cameraMode = 2;
    }

    if (event.code === "KeyC" && !event.repeat) {
      input.sideCameraIndex = (input.sideCameraIndex + 1) % 4;
    }

    if (event.code === "KeyL" && !event.repeat) {
      input.lightingEnabled = !input.lightingEnabled;
    }

    if (event.code === "KeyN" && !event.repeat) {
      input.fogEnabled = !input.fogEnabled;
    }

    event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });
}
