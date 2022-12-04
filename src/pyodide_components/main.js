import * as Idiomorph from "./idiomorph.js";
export let worker;

export function makeCustomElement(name) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.name = name;
      this.dataset.uid = "id" + Math.random().toString(16).slice(2);
    }

    connectedCallback() {
      // Tell Python we are attaching and create an instance
      // and start the lifecycle.
      const messageValue = {
        uid: this.dataset.uid,
        name: this.name,
      };
      worker.postMessage({ messageType: "make-element", messageValue });
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

function renderNode({ uid, html }) {
  const target = document.querySelector(`*[data-uid=${uid}]`);
  Idiomorph.morph(target, html, { morphStyle: "innerHTML" });
}

export const messageHandlers = {
  initialized: finishedInitialize,
  "finished-loadapp": finishedLoadApp,
  "render-node": renderNode,
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
