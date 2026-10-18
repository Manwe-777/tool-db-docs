# Base API

## `ToolDb.putData()`

Type signature:

```ts
function putData<T = any>(
  key: string,
  value: T,
  userNamespaced?: boolean
): Promise<NostrEvent>;
```

Puts a value on a key. It can be any data that can be JSON encoded: objects,
strings, numbers, booleans, arrays...

The value is signed with your identity, stored locally, and published to the
relays.

**Parameters:**

- `key` — The key to store the data at (no dots)
- `value` — The data to store
- `userNamespaced` — If `true`, the key belongs to your [namespace](./namespaces.md), only you can write it (default: `false`)

**Returns:** the signed Nostr event.

**Example:**

```ts
// A shared key
await db.putData("public-key", { name: "Alice", age: 30 });

// A key only you can write
await db.putData("my-settings", { theme: "dark" }, true);
```

::: tip Last write wins
Of all the values of a key, the newest one wins. Your own writes always
replace your previous ones, even within the same second.
:::

## `ToolDb.getData()`

Type signature:

```ts
function getData<T = any>(
  key: string,
  userNamespaced?: boolean,
  timeoutMs?: number
): Promise<T | null>;
```

Gets the value of a key, from local data and every connected relay. Every
event is verified (signature, key, namespace, custom verificators) before it
is used, and the newest valid value is returned and stored locally.

**Parameters:**

- `key` — The key to read; `:pubkey.key` reads another user's namespace
- `userNamespaced` — If `true`, reads your own namespace (default: `false`)
- `timeoutMs` — Maximum time to wait for the relays (default: `1000`ms)

**Returns:** the value, or `null` if nobody wrote it.

**Example:**

```ts
const data = await db.getData<{ name: string }>("public-key");

// Your namespace
const settings = await db.getData("my-settings", true);

// Someone else's namespace
const theirs = await db.getData(`:${alicePubkey}.my-settings`);
```

While offline it returns local data right away.

## `ToolDb.putCrdt()`

Type signature:

```ts
function putCrdt<T = any>(
  key: string,
  crdt: BaseCrdt<T, any, any>,
  userNamespaced?: boolean
): Promise<NostrEvent | null>;
```

Publishes the changes you made to a [CRDT](./crdts.md) since your last put,
as one signed change set. Changes by other authors are only published by
them.

**Returns:** the change set event, or `null` if there was nothing new.

```ts
const doc = new MapCrdt(db.userAccount.getAddress());
doc.SET("hello", "world");
await db.putCrdt("shared-doc", doc);
```

::: warning Authors
Create CRDTs with your public key as author; changes by any other author can
not be signed by you, and are not published.
:::

## `ToolDb.getCrdt()`

Type signature:

```ts
function getCrdt<T = any>(
  key: string,
  crdt: BaseCrdt<T, any, any>,
  userNamespaced?: boolean,
  timeoutMs?: number
): Promise<NostrCrdtView | null>;
```

Gets every change set of a CRDT document from local data and the relays,
verifies them, and merges their changes into `crdt`.

**Returns:** the document (with all its changes in `v`), or `null` if nobody
wrote it.

```ts
const doc = new MapCrdt(db.userAccount.getAddress());
await db.getCrdt("shared-doc", doc);
console.log(doc.value);
```

## `ToolDb.queryKeys()`

Type signature:

```ts
function queryKeys(
  prefix: string,
  userNamespaced?: boolean,
  timeoutMs?: number
): Promise<string[]>;
```

Lists the keys starting with a prefix, from local data and the relays (values
and CRDTs).

```ts
const posts = await db.queryKeys("post-");
const mine = await db.queryKeys("post-", true);
```

::: tip
Nostr relays can not filter by prefix, so this asks for every key of your
topic and filters locally. Fine for small topics; for large ones, keep lists
of keys in a value or a CRDT instead.
:::

## `ToolDb.subscribeData()`

Type signature:

```ts
function subscribeData(key: string, userNamespaced?: boolean): Promise<void>;
```

Keeps a relay subscription for a key: every newer valid value (or CRDT change
set) is stored and triggers the [key listeners](./api-listeners.md) of the
key. Listeners also get the local data right away.

```ts
db.addKeyListener("chat", (msg) => console.log("New value:", msg.v));
await db.subscribeData("chat");
```

## `ToolDb.unsubscribeData()`

```ts
function unsubscribeData(key: string, userNamespaced?: boolean): void;
```

Closes the relay subscription of a key.

## `ToolDb.getUserNamespacedKey()`

```ts
function getUserNamespacedKey(key: string): string;
```

Returns `:yourPubkey.key`.

## `ToolDb.doFunction()`

Type signature:

```ts
function doFunction<R = any, A = any>(
  name: string,
  args: A,
  options?: { server?: string; timeoutMs?: number }
): Promise<FunctionReturn<R>>;
```

Runs a server function on a [ToolDB relay node](./relay-node.md). The request
is signed, so the function knows who called it, and only responses signed by
the servers in the `functionServers` option (or `options.server`) are
accepted.

```ts
const result = await db.doFunction("add", { a: 1, b: 2 });

if (result.code === "OK") {
  console.log(result.return); // 3
} else {
  console.error(result.code, result.return); // "ERR" or "NOT_FOUND"
}
```

If no server answers in time (default `10000`ms), it returns `{ code: "ERR" }`.

## `ToolDb.ready`

A promise resolving when the storage and the signer are ready.

## `ToolDb.close()`

Closes the subscriptions, the relay connections and the storage.
