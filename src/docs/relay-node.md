# Relay Nodes

A **ToolDB relay node** is a Nostr relay for your app, from the
`@tool-db/nostr-relay` package (Node only). It:

- **validates** your app's data with the same rules as clients (signatures,
  namespaces, CRDT authors), plus its own custom verificators,
- **stores** it in a storage adapter, so it survives restarts,
- runs **server functions** clients call with `doFunction`,
- serves its **information document** (NIP-11) with its public key.

To clients it is just another relay. You can mix it with public relays: they
give reach and redundancy, your nodes give durability and functions.

## Server Setup

```ts
import { ToolDbRelay } from "@tool-db/nostr-relay";
import { ToolDbLeveldb } from "@tool-db/leveldb-store";

const relay = new ToolDbRelay({
  topic: "my-app",
  port: 8080,
  host: "0.0.0.0",
  storageAdapter: ToolDbLeveldb,
  storageName: "./data",
  // Keep the same key between restarts, clients trust it for functions
  secretKey: process.env.RELAY_SECRET_KEY,
});

await relay.start();
console.log(relay.url, relay.pubkey);
```

### Options

| Option                | Default         | Description                                                           |
| --------------------- | --------------- | --------------------------------------------------------------------- |
| `topic`               | (required)      | The app topic this node serves                                        |
| `port`, `host`        | `0`, `127.0.0.1`| Where to listen (`0` picks a free port)                               |
| `server`              |                 | An existing HTTP server to attach to, instead of a port               |
| `storageAdapter`      | in memory       | Storage for the events, like `ToolDbLeveldb` or `redisStore(url)`     |
| `storageName`         | `tooldb-relay`  | Storage name (folder, database...)                                    |
| `secretKey`           | random          | The node's Nostr secret key (hex), signs function responses           |
| `acceptForeignEvents` | `false`         | Also store any other Nostr event, like a regular relay                |
| `listenRelays`        | `[]`            | Other relays to answer function requests on                           |
| `maxMessageSize`      | 128KB           | Max size of a message                                                 |
| `maxFutureSeconds`    | `60`            | Max seconds an event can be in the future                             |

By default a node only accepts ToolDB data of its topic (plus profiles), and
rejects anything invalid, so its storage only holds valid data.

## Custom verification

The same verificators clients use:

```ts
import { onlyAuthors } from "tool-db";

relay.addCustomVerification("announcements", onlyAuthors([adminPubkey]));
relay.addCustomVerification("requests-", async (msg) =>
  msg.v.every((change) => change.k === msg.a)
);
```

## Server Functions

```ts
relay.addServerFunction<number, { a: number; b: number }>(
  "add",
  async ({ a, b }, caller) => {
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("Invalid arguments"); // returned as { code: "ERR" }
    }
    return a + b;
  }
);
```

Functions get the arguments and the public key of the caller, so they can
check permissions. Clients call them with the node's public key in their
`functionServers` option:

```ts
const db = new ToolDb({
  relays: [relay.url],
  topic: "my-app",
  functionServers: [relay.pubkey],
});

await db.doFunction("add", { a: 1, b: 2 }); // { code: "OK", return: 3 }
```

- Requests and responses are signed Nostr events that relays never store.
- Clients only accept responses signed by their function servers.
- Each request runs once, even if it arrives through several relays, and
  requests older than 60 seconds are ignored, so they can not be replayed.
- Arguments and results are not encrypted.

### Through public relays

With `listenRelays`, the node also listens for requests on other relays, so
clients do not need to connect to it directly:

```ts
const relay = new ToolDbRelay({
  topic: "my-app",
  listenRelays: ["wss://relay.damus.io", "wss://nos.lol"],
});
```

The relays in between only forward the events; requests name their server,
so other nodes ignore them.

## Information document

```bash
curl -H "Accept: application/nostr+json" http://127.0.0.1:8080
# { "pubkey": "...", "supported_nips": [1, 11], ... }
```

## A plain Nostr relay

`NostrRelay` is the relay without ToolDB rules, with an `acceptEvent` hook and
pluggable storage (`MemoryEventStore`, or `StorageEventStore` on a storage
adapter).

```ts
import { NostrRelay } from "@tool-db/nostr-relay";

const relay = new NostrRelay({
  port: 7777,
  acceptEvent: (event) => event.kind === 1 || "only notes",
});
await relay.start();
```
