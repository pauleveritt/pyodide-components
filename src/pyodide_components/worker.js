import { loadPyodide } from "./pyodide/pyodide.mjs";

export async function loadApp({ appName }) {
  let appContent;
  const response = await fetch(`./${appName}.py`);
  if (response.ok) {
    appContent = await response.text();
  } else {
    console.log(`Failed to fetch ${appName}`);
  }
  self.pyodide.FS.writeFile(`${appName}.py`, appContent, { encoding: "utf8" });

  // Python timestamp thing with MEMFS
  // https://github.com/pyodide/pyodide/issues/737
  self.pyodide.runPython("import importlib; importlib.invalidate_caches()");
  const appModule = self.pyodide.pyimport(appName);

  // Now register the app and update the local registry
  self.pyodide_components.initialize_app(appModule);
  self.registry = self.pyodide_components.get_registry().toJs();

  return { messageType: "finished-loadapp", messageValue: self.registry };
}

export async function initialize() {
  if (!self.pyodide) {
    self.pyodide = await loadPyodide();
  }

  const response = await fetch("./__init__.py");
  if (response.ok) {
    const loaderContent = await response.text();
    const pathInfo = self.pyodide.FS.analyzePath("pyodide_components");
    if (!pathInfo.exists) {
      self.pyodide.runPython("import os; os.mkdir('pyodide_components')");
    }
    self.pyodide.FS.writeFile("pyodide_components/__init__.py", loaderContent, {
      encoding: "utf8",
    });
    // Python timestamp thing with MEMFS
    // https://github.com/pyodide/pyodide/issues/737
    self.pyodide.runPython("import importlib; importlib.invalidate_caches()");
    self.pyodide_components = self.pyodide.pyimport("pyodide_components");
    self.registry = self.pyodide_components.get_registry().toJs();
  } else {
    console.log("Failed to fetch __init__.py");
  }

  return {
    messageType: "initialized",
    messageValue: "Pyodide app is initialized",
  };
}

export function makeElement({ uid, name }) {
  // Post a message to Pyodide telling it to make a node then render
  const html = self.pyodide_components.make_element(uid, name);
  renderNode(uid, html);
}

function renderNode(uid, html) {
  self.postMessage({
    messageType: "render-node",
    messageValue: { uid, html },
  });
}

const messageHandlers = {
  initialize: initialize,
  "make-element": makeElement,
  "load-app": loadApp,
};

export async function dispatcher({ messageType, messageValue }) {
  if (!(messageType in messageHandlers)) {
    throw `No message handler for "${messageType}"`;
  }
  const handler = messageHandlers[messageType];
  const result = await handler(messageValue);
  if (result) {
    return {
      messageType: result.messageType,
      messageValue: result.messageValue,
    };
  }
}

self.onmessage = async (e) => {
  // Unpack the message structure early to get early failure.
  const { messageType, messageValue } = e.data;
  const responseMessage = await dispatcher({ messageType, messageValue });
  if (responseMessage) {
    self.postMessage(responseMessage);
  }
};
