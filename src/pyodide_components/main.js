export let worker;

export function finishedInitialize(messageValue) {
    const status = document.getElementById("status");
    status.innerText = messageValue;
}

export const messageHandlers = {
    "initialized": finishedInitialize,
};

export function dispatcher({messageType, messageValue}) {
    if (!(messageType in messageHandlers)) {
        throw `No message handler for "${messageType}"`;
    }
    messageHandlers[messageType](messageValue);
}

export function initialize() {
    worker = new Worker("worker.js", {type: "module"});
    worker.onmessage = ({data}) => dispatcher(data);
    worker.postMessage({messageType: "initialize"});
}

if (navigator.userAgent !== "Happy DOM") {
    // We are running in a browser, not in a test, so initialize.
    initialize();
}
