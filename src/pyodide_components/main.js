export let worker;

export function makeCustomElement(name) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.name = name;
    }

    connectedCallback() {
      this.innerHTML = `<div>Element: <em>${this.name}</em></div>`;
    }
  };
}

export function finishedLoadApp(registryEntries) {
  // When an app loads components, the worker gives us an updated registry.
  registryEntries.forEach((entry) => {
    const name = entry.get("name");
    customElements.define(name, makeCustomElement(name));
  });
}

export function finishedInitialize(messageValue) {
  const status = document.getElementById("status");
  status.innerText = messageValue;

  worker.postMessage({
    messageType: "load-app",
    messageValue: { appName: "counter" },
  });
}

export const messageHandlers = {
  initialized: finishedInitialize,
  "finished-loadapp": finishedLoadApp,
};

export function dispatcher({ messageType, messageValue }) {
  if (!(messageType in messageHandlers)) {
    throw `No message handler for "${messageType}"`;
  }
  messageHandlers[messageType](messageValue);
}

export function initialize() {
  worker = new Worker("worker.js", { type: "module" });
  worker.onmessage = ({ data }) => dispatcher(data);
  worker.postMessage({ messageType: "initialize" });
}

if (navigator.userAgent !== "Happy DOM") {
  // We are running in a browser, not in a test, so initialize.
  initialize();
}
