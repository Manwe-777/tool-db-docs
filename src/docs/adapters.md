# Adapters

Adapters replace parts of the database with other implementations. There
are two kinds: **storage adapters** (where data is kept) and **user
adapters** (signers, who holds the key).

::: tip No network adapters
Version 2 had network adapters (WebSocket, WebRTC, hybrid). Tool Db 3 always
uses Nostr relays, through the relay pool in the core.
:::

## Storage Adapters

| Adapter             | Package                    | Runs on  |
| ------------------- | -------------------------- | -------- |
| `ToolDbMemoryStore` | `tool-db` (default)        | Anywhere |
| `ToolDbIndexedDb`   | `@tool-db/indexeddb-store` | Browsers |
| `ToolDbLeveldb`     | `@tool-db/leveldb-store`   | Node     |
| `ToolDbRedis`       | `@tool-db/redis-store`     | Node     |

They are used by clients (`storageAdapter` option) and by
[relay nodes](./relay-node.md).

### Memory Store

The default; data is lost when the page or process closes.

### IndexedDB Store

```ts
import { ToolDbIndexedDb } from "@tool-db/indexeddb-store";

new ToolDb({ storageAdapter: ToolDbIndexedDb, storageName: "my-app" });
```

### LevelDB Store

```ts
import { ToolDbLeveldb } from "@tool-db/leveldb-store";

new ToolDb({ storageAdapter: ToolDbLeveldb, storageName: "./data" });
```

`storageName` is the folder.

### Redis Store

```ts
import { ToolDbRedis, redisStore } from "@tool-db/redis-store";

// The local server (redis://localhost:6379)
new ToolDb({ storageAdapter: ToolDbRedis, storageName: "my-app" });

// Another server
new ToolDb({
  storageAdapter: redisStore("redis://user:password@host:6379/0"),
  storageName: "my-app",
});
```

Keys are prefixed with the storage name, so stores can share a server.

## User Adapters

| Adapter           | Holds the key       |
| ----------------- | ------------------- |
| `ToolDbNostrUser` | In memory (default) |
| `ToolDbNip07User` | A browser extension |

See [Identity](./api-user.md).

## Writing Custom Adapters

### Custom Storage Adapter

Extend `ToolDbStorageAdapter`. Keys and values are strings.

```ts
import { ToolDbStorageAdapter, StorageContext } from "tool-db";

class MyStore extends ToolDbStorageAdapter {
  constructor(context: StorageContext, forceStorageName?: string) {
    super(context, forceStorageName);
    // Set this if opening the storage is asynchronous
    this._readyPromise = openMyStorage(this.storageName);
  }

  async put(key: string, data: string) {
    await this.waitForReady();
    // store data at key
  }

  async get(key: string): Promise<string> {
    await this.waitForReady();
    // return the data, or throw if the key does not exist
  }

  async query(prefix: string): Promise<string[]> {
    await this.waitForReady();
    // return every key starting with prefix
  }

  async delete(key: string) {
    await this.waitForReady();
    // remove the key
  }

  async close() {
    // optional, release the storage
  }
}
```

`StorageContext` is `{ options: { storageName }, logger }`, so adapters work
for both databases and relay nodes.

### Custom User Adapter

Extend `ToolDbUserAdapter` to sign with something else:

```ts
import { ToolDbUserAdapter, EventTemplate, NostrEvent } from "tool-db";

class MySigner extends ToolDbUserAdapter {
  get ready() {
    // optional, if the public key is loaded asynchronously
    return this.loading;
  }

  async signEvent(event: EventTemplate): Promise<NostrEvent> {
    // return the signed event
  }

  getAddress() {
    // hex public key
  }

  async nip44Encrypt(publicKey: string, plaintext: string) {
    // optional, for encryption
  }

  async nip44Decrypt(publicKey: string, payload: string) {
    // optional, for encryption
  }
}
```

Every event is verified with Schnorr signatures, so a signer can not make
invalid data valid.

## Examples

The [example chat app](https://github.com/Manwe-777/tool-db/tree/main/example)
uses IndexedDB and both signers, and its development relay uses LevelDB.
