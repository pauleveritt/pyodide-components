export let worker;

export function finishedInitialize(messageValue) {
    //
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
    // worker.onmessage = dispatcher;
    worker.postMessage({messageType: "initialize"});
}
