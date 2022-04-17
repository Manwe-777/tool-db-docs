# Listeners

## `ToolDb.addIdListener()`

Type signature:

```ts
function addIdListener(id: string, fn: (msg: ToolDbMessage) => void): void
```

Creates a listener that will be executed when a message with id `id` is recieved. The callback function argument `msg` will contain all of the message data, including signatures and hashes as well as the payload.

Only one listener per id is allowed, adding a new listener to the same id will replace the previous one.

## `ToolDb.removeIdListener()`

Type signature:

```ts
function removeIdListener(id: string): void
```

Removes the listener for id `id`.

## `ToolDb.addKeyListener()`

Type signature:

```ts
function addKeyListener<T>(
  key: string,
  fn: (msg: PutMessage<T> | CrdtMessage) => void
): number
```

Creates a listener for all keys that start with `key`. For example, a key listener on key `group-` will trigger for a PUT at key `group-10233`.

The callback function will contain the entire message data, including signatures and hashes as well as the payload.

The function returns a number that can be used as a handler to remove the listener with `removeKeyListener`

A single key can have many listeners for the same key, so its the developer's responsibility to remove unused listeners to avoid leaks and problems.

## `ToolDb.removeKeyListener()`

Type signature:

```ts
function removeKeyListener(id: number): void
```

Removes the listener at `id`.


## `ToolDb.addCustomVerification()`

Type signature:

```ts
function addCustomVerification<T>(
  key: string,
  fn: (msg: VerificationData<T> & BaseMessage, previous: T | undefined) => Promise<boolean>
): number
```

Creates a custom verification function for all incoming messages whose key starts with `key`. The verification function will be executed for each message recieved matching the key and must return a boolean promise (or be async and return a boolean). If the result of the verification is `false`, the verification process will stop and the message will not be relayed or stored in the database.

The first object passed to the verification is a message of types [VerificationData](types.html#verificationdata) and [BaseMessage](types.html#basemessage).

The second argument passed is the previously-stored data at this key, used for comparison purposes. (eg; to verify a user is only editing the allowed parts of the document).

The function returns a number that can be used as a handler to remove it with `removeCustomVerification`

This is a very powerful function that can be used to create stricter networks with very specific rules, this way you can avoid users using the network as a database for purposes not related to your app, for example, if you want to only allow users to write to their own namespace you can use the following;

```ts
function privateNamespaceOnly(msg: VerificationData & BaseMessage, previous) {
  return new Promise<boolean>((resolve) => {
    if (msg.k.startsWith(":")) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

// an empty key will trigger for every message!
Bob.addCustomVerification("", privateNamespaceOnly)
```

## `ToolDb.removeCustomVerification()`

Type signature:

```ts
function removeCustomVerification(id: number): void
```

Removes the custom verification function with `id`
