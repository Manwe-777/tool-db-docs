# Getting Started

## Introduction

A Tool Db app is made of **clients** (browsers or Node) that read and write
data through **Nostr relays**. You can use public Nostr relays, run your own
[ToolDB relay node](./relay-node.md), or both. Clients verify everything they
receive, so relays do not need to be trusted.

## Installation

```bash
npm install tool-db@next
```

Then, depending on where your data is kept:

```bash
npm install @tool-db/indexeddb-store@next   # browsers
npm install @tool-db/leveldb-store@next     # Node
npm install @tool-db/nostr-relay@next       # to run a relay node (Node)
```

The packages are published under the `next` tag while they are tested.

## A relay to connect to

For development, run a ToolDB relay node:

```ts
// relay.mjs
import { ToolDbRelay } from "@tool-db/nostr-relay";

const relay = new ToolDbRelay({ topic: "my-app", port: 8080 });
await relay.start();
console.log(relay.url); // ws://127.0.0.1:8080
```

Any other Nostr relay works too, like `wss://relay.damus.io` or
`wss://nos.lol`.

## Basic Client Setup

```ts
import { ToolDb } from "tool-db";
import { ToolDbIndexedDb } from "@tool-db/indexeddb-store";

const db = new ToolDb({
  relays: ["ws://127.0.0.1:8080"],
  topic: "my-app",
  storageAdapter: ToolDbIndexedDb,
});

await db.ready;
```

The `topic` is the namespace of your app: apps sharing relays only see their
own keys.

## Identity

A new database has a new random Nostr identity:

```ts
console.log(db.userAccount.getAddress()); // hex public key
```

Sign in with an existing key, or use the user's browser extension:

```ts
await db.keysSignIn("nsec1...");

// or
new ToolDb({ relays, topic: "my-app", userAdapter: ToolDbNip07User });
```

See [Identity](./api-user.md) to save keys with a password, and for profiles.

## Storing Data

```ts
// A shared key, anyone can write it
await db.putData("greeting", "Hello world!");

// A key in your namespace, only you can write it
await db.putData("profile-settings", { theme: "dark" }, true);
```

## Retrieving Data

```ts
const greeting = await db.getData<string>("greeting");

// Your namespace
const settings = await db.getData("profile-settings", true);

// Someone else's namespace
const theirs = await db.getData(`:${otherPubkey}.profile-settings`);
```

## Real-time Updates

```ts
db.addKeyListener<string>("greeting", (msg) => {
  console.log(`${msg.a} says ${msg.v}`);
});
await db.subscribeData("greeting");
```

## Connection Events

```ts
db.onConnect = () => console.log("Connected to a relay");
db.onDisconnect = () => console.log("Offline, data is kept locally");
```

## Using a bundle

The `tool-db` package includes a browser bundle that exposes everything in
`tooldb`:

```html
<script src="https://unpkg.com/tool-db/bundle.js"></script>
<script>
  const { ToolDb } = tooldb;
  const db = new ToolDb({ relays: ["wss://relay.example.com"], topic: "my-app" });
</script>
```

## Complete Example

A shared counter of visits, where every visitor can add to the count:

```ts
import { ToolDb, CounterCrdt } from "tool-db";

const db = new ToolDb({ relays: ["ws://127.0.0.1:8080"], topic: "my-app" });
await db.ready;

const visits = new CounterCrdt(db.userAccount.getAddress());
await db.getCrdt("visits", visits);
visits.ADD(1);
await db.putCrdt("visits", visits);

console.log(`${visits.value} visits`);
```

## Next Steps

- [Namespaces](./namespaces.md) — who can write which keys
- [CRDTs](./crdts.md) — shared documents with many authors
- [Encryption](./encryption.md) — private data and groups
- [Relay nodes](./relay-node.md) — your own server, with server functions
- [The example chat app](https://github.com/Manwe-777/tool-db/tree/main/example)
