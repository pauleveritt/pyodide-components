# Worker Messaging

Our worker has a dispatcher, but it isn't yet receiving or sending messages with the main module.
Let's set up the `postMessage` machinery used in workers.

## Receive messages

As explained in the [MDN page for web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#sending_messages_to_and_from_a_dedicated_worker), you handle incoming messages by defining an `onmessage` function.
This can be at module scope or on the `self` variable, which is what we'll do.

We'll start of course with a test.
We'll start small:

```javascript
test("handles incoming messages with onmessage", async () => {
    expect(self.onmessage).to.exist;
});
```

This fails of course, so add the following to `worker.js`:

```javascript
self.onmessage = async (e) => {
    // Unpack the message structure early to get early failure.
    const {messageType, messageValue} = e.data;
    const responseMessage = await dispatcher({messageType, messageValue});
    if (responseMessage) {
        self.postMessage(responseMessage);
    }
};
```

This code acts as a mediator between worker messaging and the dispatcher:
- Unpack the "protocol" of `messageType` and `messageValue`
- Call the dispatcher
- If the dispatched function returns something, post it back to the main module

This last point is a convenience.
Our dispatched functions can always call `self.postMessage` themselves.
But that's binding the unique mechanics of web workers into our logic.

We now have something to confront.
We need to test calling `self.onmessage` and we want to see if `self.postMessage` was called.
Even better, called with what we expect.

Mocking to the rescue.

## Mocking `self.postMessage`

While `self` exists in `happy-dom`, `self.postMessage` doesn't.
We need to do two things in `tests/setup.js`:

- Create a pretend aka "mock" implementation for `postMessage`
- Register it on global

Add the following to `tests/setup.js`:

```javascript
if (!globalThis["worker"]) {
    self.postMessage = vi.fn();
}
```

This allows our code to pretend to call `self.postMessage`.
Of course, nothing happens, but we don't care.
Our `worker.test.js` code is in isolation, only interested in the worker, not the communication with main.

## Testing `self.onmessage`

We now have the pieces in place.
We can test the `self.onmessage` function which receives messages from main:

```javascript
test("handles incoming messages with onmessage", async () => {
    expect(self.onmessage).to.exist;
    expect(self.postMessage).to.exist;

    // Make a fake worker message
    const event = new MessageEvent("message");
    event.data = {messageType: "initialize", messageValue: null};

    // Spy on self.postMessage, then call our handler
    const spy = vi.spyOn(self, "postMessage");
    await self.onmessage(event);

    expect(spy).toHaveBeenCalledWith({messageType: "initialized"});
});
```

- The first two `expect` just make sure our `self` has what we expect
- We then simulate the event object from the main<->worker communication
- Create a "spy" to watch the calling of `self.postMessage`
- Call `self.onmessage` and see if the resulting message back, matched what we thought

## Layout of our worker

So what does this `worker.js` implementation look like?
It's a 3-layer cake:

- The event listener which mediates with the main thread via messages
- The dispatcher, which finds the right message handler, calls it, and returns the message
- Handler functions which don't really know the outside world beyond `self` 
