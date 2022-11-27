import {loadPyodide} from "./pyodide/pyodide.mjs";


export async function initialize() {
    let loaderContent;
    if (!self.pyodide) {
        self.pyodide = await loadPyodide();
    }
    const response = await fetch("./__init__.py");
    if (response.ok) {
        loaderContent = await response.text();
    } else {
        console.log("Failed to fetch loader.py");
    }
    return pyodide;
}

export async function dispatcher({messageType, messageValue}) {
    if (messageType === "initialize") {
        await initialize();
        return {messageType: "initialized"};
    }
    throw `No message handler for "${messageType}"`;
}

self.onmessage = async (e) => {
    // Unpack the message structure early to get early failure.
    const {messageType, messageValue} = e.data;
    const responseMessage = await dispatcher({messageType, messageValue});
    if (responseMessage) {
        self.postMessage(responseMessage);
    }
};
