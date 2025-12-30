# Base API

## `ToolDb.putData()`

Type signature:

```ts
function putData<T = any>(
  key: string,
  value: T,
  userNamespaced?: boolean
): Promise<PutMessage<T> | null>;
```

Puts data in the database. It can be any type of data (as long as it can be JSON encoded): objects, strings, numbers, booleans, arrays, etc.

**Parameters:**

- `key` — The key to store the data at
- `value` — The data to store
- `userNamespaced` — If `true`, the data will be stored under your public key namespace (default: `false`)

**Returns:** A promise resolving to the message that was relayed (containing the message hash, key, signature, etc), or `null` on failure.

**Example:**

```ts
// Store public data
await db.putData("public-key", { name: "Alice", age: 30 });

// Store private (user-namespaced) data
await db.putData("my-settings", { theme: "dark" }, true);
```

## `ToolDb.getData()`

Type signature:

```ts
function getData<T = any>(
  key: string,
  userNamespaced?: boolean,
  timeoutMs?: number
): Promise<T | null>;
```

Gets the data stored at `key`. If not found locally, it will query connected peers.

**Parameters:**

- `key` — The key to retrieve
- `userNamespaced` — If `true`, includes your public key in the namespace (default: `false`)
- `timeoutMs` — Maximum time to wait for peer responses (default: `1000`ms)

**Returns:** A promise resolving to the data, or `null` if not found.

**Example:**

```ts
const data = await db.getData<{ name: string }>("public-key");
console.log(data?.name);

// Get user-namespaced data
const settings = await db.getData("my-settings", true);
```

::: tip
The first response from any peer will be returned immediately. If more up-to-date data arrives later, it will be stored for subsequent calls.
:::

## `ToolDb.putCrdt()`

Type signature:

```ts
function putCrdt<T = any>(
  key: string,
  crdt: BaseCrdt<T, any, any>,
  userNamespaced?: boolean
): Promise<CrdtPutMessage | null>;
```

Puts CRDT changes to the database. This sends only the changes from the CRDT, not the full state.

**Parameters:**

- `key` — The key to store the CRDT at
- `crdt` — The CRDT instance containing changes
- `userNamespaced` — If `true`, stores under your public key namespace (default: `false`)

**Example:**

```ts
import { MapCrdt } from "tool-db";

const map = new MapCrdt(db.userAccount.getAddress() || "");
map.SET("name", "Alice");
map.SET("age", 30);

await db.putCrdt("my-profile", map, true);
```

## `ToolDb.getCrdt()`

Type signature:

```ts
function getCrdt<T, C extends BaseCrdt<T, any, any>>(
  key: string,
  crdt: C,
  userNamespaced?: boolean,
  timeoutMs?: number
): Promise<C>;
```

Gets a CRDT document and merges received changes into the provided CRDT instance.

**Parameters:**

- `key` — The key to retrieve
- `crdt` — The CRDT instance to merge changes into
- `userNamespaced` — If `true`, includes your public key in the namespace (default: `false`)
- `timeoutMs` — Maximum time to wait for peer responses (default: `1000`ms)

**Returns:** A promise resolving to the CRDT instance with merged changes.

**Example:**

```ts
import { MapCrdt } from "tool-db";

const map = new MapCrdt(db.userAccount.getAddress() || "");
await db.getCrdt("my-profile", map, true);

console.log(map.value); // { name: "Alice", age: 30 }
```

## `ToolDb.queryKeys()`

Type signature:

```ts
function queryKeys(
  key: string,
  userNamespaced?: boolean,
  timeoutMs?: number
): Promise<string[] | null>;
```

Queries connected peers for all keys starting with `key`.

**Parameters:**

- `key` — The key prefix to search for
- `userNamespaced` — If `true`, includes your public key in the namespace (default: `false`)
- `timeoutMs` — Maximum time to wait for peer responses (default: `1000`ms)

**Returns:** A promise resolving to an array of matching keys, or `null` on failure.

**Example:**

```ts
// Find all user profiles
const profileKeys = await db.queryKeys(":"); // All private namespace keys

// Find all keys in a specific namespace
const chatKeys = await db.queryKeys("chat-messages-");
```

::: tip
This function returns only the keys, not the data. Use it for indexing before retrieving specific data with `getData()`.
:::

## `ToolDb.subscribeData()`

Type signature:

```ts
function subscribeData(key: string, userNamespaced?: boolean): void;
```

Subscribes to updates for a specific key. Combined with `addKeyListener()`, this enables real-time data updates.

**Parameters:**

- `key` — The key to subscribe to
- `userNamespaced` — If `true`, includes your public key in the namespace (default: `false`)

**Example:**

```ts
// Subscribe to updates
db.subscribeData("chat-messages");

// Listen for changes
db.addKeyListener("chat-messages", (msg) => {
  console.log("New message:", msg.v);
});
```

## `ToolDb.getUserNamespacedKey()`

Type signature:

```ts
function getUserNamespacedKey(key: string): string;
```

Transforms a key to be user-namespaced according to the key specification.

**Example:**

```ts
const nsKey = db.getUserNamespacedKey("my-data");
// Returns: ":0x1234...abcd.my-data" (with your public key)
```

## `ToolDb.doFunction()`

Type signature:

```ts
function doFunction<A, R>(
  functionName: string,
  args: A,
  timeoutMs?: number
): Promise<FunctionReturn<R>>;
```

Executes a server-defined function on a connected server peer.

**Parameters:**

- `functionName` — The name of the server function to call
- `args` — Arguments to pass to the function
- `timeoutMs` — Maximum time to wait for response (default: `1000`ms)

**Returns:** A promise resolving to the function result.

**Example:**

```ts
const result = await db.doFunction<{ userId: string }, { balance: number }>(
  "getBalance",
  { userId: "user123" }
);

if (result.code === "OK") {
  console.log("Balance:", result.return.balance);
}
```

## `ToolDb.ready`

Type signature:

```ts
get ready(): Promise<void>
```

A promise that resolves when the database is fully initialized. Use this to wait for initialization before performing operations.

**Example:**

```ts
const db = new ToolDb({
  /* options */
});

// Wait for full initialization
await db.ready;

// Now safe to use
await db.anonSignIn();
```

## `ToolDb.close()`

Type signature:

```ts
async close(): Promise<void>
```

Properly closes all stores to prevent resource leaks. Call this when you're done with the database instance.

**Example:**

```ts
// When shutting down
await db.close();
```
