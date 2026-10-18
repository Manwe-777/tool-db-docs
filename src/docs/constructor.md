# ToolDb Constructor

## Basic Usage

```ts
import { ToolDb } from "tool-db";

const db = new ToolDb({
  relays: ["wss://relay.example.com"],
  topic: "my-app",
});

await db.ready;
```

Every option is optional. Without relays the database works offline, with
local data only.

## Options

```ts
interface ToolDbOptions {
  debug: boolean;
  relays: string[];
  topic: string;
  functionServers: string[];
  triggerDebouce: number;
  storageName: string;
  storageAdapter: typeof ToolDbStorageAdapter;
  userAdapter: typeof ToolDbUserAdapter;
  WebSocket: WebSocketConstructor | undefined;
}
```

| Option            | Default             | Description                                                                                  |
| ----------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `relays`          | `[]`                | Nostr relays to connect to                                                                   |
| `topic`           | `"tool-db-default"` | The namespace of your app. Apps sharing relays only see the keys of their own topic          |
| `functionServers` | `[]`                | Public keys of the [relay nodes](./relay-node.md) trusted to run server functions            |
| `storageAdapter`  | `ToolDbMemoryStore` | Local storage. In memory by default, use LevelDB (Node) or IndexedDB (browsers) to keep data |
| `storageName`     | `"tooldb"`          | Name of the local storage (folder, database name...)                                         |
| `userAdapter`     | `ToolDbNostrUser`   | The signer of your identity: a local Nostr key by default, see [Identity](./api-user.md)     |
| `WebSocket`       | global `WebSocket`  | WebSocket implementation, for runtimes without a global one                                  |
| `triggerDebouce`  | `100`               | Milliseconds key listeners wait before firing, to group quick updates                        |
| `debug`           | `false`             | Log what the database does                                                                   |

## Configuration Examples

### Browser app

```ts
import { ToolDb } from "tool-db";
import { ToolDbIndexedDb } from "@tool-db/indexeddb-store";

const db = new ToolDb({
  relays: ["wss://relay.example.com", "wss://relay2.example.com"],
  topic: "my-app",
  storageAdapter: ToolDbIndexedDb,
  storageName: "my-app",
});
```

### Node client

```ts
import { ToolDb } from "tool-db";
import { ToolDbLeveldb } from "@tool-db/leveldb-store";

const db = new ToolDb({
  relays: ["ws://127.0.0.1:8080"],
  topic: "my-app",
  storageAdapter: ToolDbLeveldb,
  storageName: "./data",
});

// Sign in with an existing key, instead of a new random one
await db.keysSignIn(process.env.NOSTR_SECRET_KEY!, "my-bot");
```

### With a browser extension

```ts
import { ToolDb, ToolDbNip07User } from "tool-db";

const db = new ToolDb({
  relays: ["wss://relay.example.com"],
  topic: "my-app",
  userAdapter: ToolDbNip07User,
});

// Rejects if there is no Nostr extension
await db.ready;
```

### With server functions

```ts
const db = new ToolDb({
  relays: ["wss://my-node.example.com"],
  topic: "my-app",
  functionServers: ["<public key of the relay node>"],
});

const result = await db.doFunction("add", { a: 1, b: 2 });
```

::: tip Servers
A Tool Db server is a [ToolDB relay node](./relay-node.md), from the
`@tool-db/nostr-relay` package. `ToolDb` itself is always a client.
:::

## Properties

### `db.ready`

A promise resolving when the storage and the signer are ready. It rejects if
they can not start, for example `ToolDbNip07User` without an extension.

### `db.isConnected`

`true` while connected to at least one relay.

### `db.options`

The options in use, with the defaults filled in.

### `db.relays`

The relay pool (`RelayPool`): `publish(event)`, `query(filters)`,
`subscribe(filters, onEvent)` and `connected` (number of connected relays).
Use it to work with raw Nostr events.

### `db.store`

The local storage adapter.

### `db.userAccount`

The signer of your identity. See [Identity](./api-user.md).

## Event Callbacks

### `db.onConnect`

Called when the first relay connects.

```ts
db.onConnect = () => console.log("Online");
```

### `db.onDisconnect`

Called when no relay is connected anymore. Data keeps being stored locally,
and relays reconnect with backoff.

## Events

`ToolDb` is an `EventEmitter`:

- `init` — when ready, with our public key
- `data` — every time new verified data is stored: a record for values, a
  view with all the changes for CRDTs (see [Listeners](./api-listeners.md))

## Methods

### `db.close()`

Closes the subscriptions, the relay connections and the storage.

```ts
await db.close();
```
