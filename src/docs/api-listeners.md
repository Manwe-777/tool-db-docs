# Listeners API

Listeners let you react to data changes in real time, and custom verificators
let you add your own rules to what data is accepted.

## Key Listeners

### `ToolDb.addKeyListener()`

```ts
function addKeyListener<T>(
  key: string,
  fn: (msg: VerificationData<T>) => void
): number;
```

Calls `fn` every time new verified data is stored for `key`, whether you wrote
it or it came from a relay. Use the full key (`:pubkey.key` for user
namespaces). Returns an id to remove the listener.

Listeners are debounced (`triggerDebouce` option, 100ms by default), so quick
updates trigger them once.

```ts
const id = db.addKeyListener<string>("chat", (msg) => {
  console.log(`${msg.a} wrote ${msg.v}`);
});

// Get updates from the relays too
await db.subscribeData("chat");
```

For values, `msg` is a record:

```ts
interface VerificationData<T> {
  k: string; // key
  a: string; // author (public key)
  t: number; // timestamp, in milliseconds
  h: string; // event id
  s: string; // event signature
  v: T; // the value
  c: string | null; // CRDT type, null for values
}
```

For CRDT keys, `msg` is the document with all its changes in `v`, so a
listener can merge them:

```ts
const doc = new MapCrdt(db.userAccount.getAddress());
db.addKeyListener<MapChanges<string>[]>("shared-doc", (msg) => {
  doc.mergeChanges(msg.v);
});
await db.subscribeData("shared-doc");
```

### `ToolDb.removeKeyListener()`

```ts
function removeKeyListener(id: number): void;
```

### `ToolDb.triggerKeyListener()`

```ts
function triggerKeyListener<T>(key: string, message: VerificationData<T>): void;
```

Triggers the listeners of a key manually.

## Custom Verification

Every piece of data is verified before it is stored: signature, key,
namespace owner, timestamp, and for CRDTs that every change is authored by
its signer. Custom verificators add your own rules on top, for any key
starting with a prefix.

### `ToolDb.addCustomVerification()`

```ts
function addCustomVerification<T = any>(
  key: string,
  fn: (msg: VerificationData<T>, previous: any) => Promise<boolean>
): number;
```

- `key` — a key prefix
- `fn` — gets the data (for CRDTs, one change set: `msg.v` are its changes
  and `msg.a` their proven author) and the previous data of the key; returns
  `true` to accept it

All matching verificators must accept the data. Data that fails is not
stored and does not trigger listeners.

### Verification Examples

Only some users can write a shared key, with the `onlyAuthors` helper:

```ts
import { onlyAuthors } from "tool-db";

db.addCustomVerification("announcements", onlyAuthors([adminPubkey]));
```

Values can only grow:

```ts
db.addCustomVerification<number>("score-", async (msg, previous) => {
  return typeof msg.v === "number" && (!previous || msg.v > previous.v);
});
```

In a shared CRDT map, users can only write their own entry:

```ts
db.addCustomVerification<MapChanges<string>[]>("requests-", async (msg) => {
  return msg.v.every((change) => change.k === msg.a);
});
```

No deletions in a CRDT:

```ts
db.addCustomVerification<MapChanges<string>[]>("log-", async (msg) => {
  return msg.v.every((change) => change.t !== "DEL");
});
```

::: warning Rules about who wrote first
Rules based on who wrote first (like "the first user to take a name keeps
it") can not be enforced on an open network: timestamps are chosen by the
signer, and peers see data in different orders. Rules based on who is
writing (like `onlyAuthors`) can.
:::

::: tip Relay nodes
Verificators run where they are added. Add the same ones to your
[relay nodes](./relay-node.md) so they do not store data your app rejects.
:::

### `ToolDb.removeCustomVerification()`

```ts
function removeCustomVerification(id: number): void;
```

## Complete Example

```ts
import { ToolDb, onlyAuthors } from "tool-db";

const db = new ToolDb({ relays, topic: "my-app" });

// Only the admin can post announcements
db.addCustomVerification("announcement", onlyAuthors([adminPubkey]));

db.addKeyListener<string>("announcement", (msg) => {
  showBanner(msg.v);
});
await db.subscribeData("announcement");
```
