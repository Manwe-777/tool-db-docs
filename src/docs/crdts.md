# CRDTs

**CRDTs** (Conflict-free Replicated Data Types) let many users change the
same document at the same time, offline or online, and every peer ends up
with the same result, whatever order it receives the changes in.

In Tool Db every CRDT change is **signed by its author**: when you put a
CRDT, your new changes are published as one signed change set, and every
reader checks that each change in it was made by its signer. So the author
of every change is provable, and relays can not add or alter changes.

## Built-in CRDT Types

| Type             | Value              | Operations          |
| ---------------- | ------------------ | ------------------- |
| `MapCrdt<T>`     | `Record<string, T>`| `SET`, `DEL`        |
| `ListCrdt<T>`    | `T[]`              | `PUSH`, `INS`, `DEL`|
| `CounterCrdt`    | `number`           | `ADD`, `SUB`        |

Create them with **your public key as author**:

```ts
const doc = new MapCrdt<string>(db.userAccount.getAddress());
```

Changes by any other author can not be signed by you, so they are not
published.

## MapCRDT

A key-value map.

### MapCRDT Operations

```ts
import { MapCrdt } from "tool-db";

const map = new MapCrdt<string>(db.userAccount.getAddress());
map.SET("name", "Alice");
map.SET("color", "blue");
map.DEL("color");

console.log(map.value); // { name: "Alice" }
```

### MapCRDT Resolution

Each change of a key has an index, one more than the last change its author
saw; the highest index wins. For the same index, `DEL` wins over `SET`, and
between two `SET`s the author with the highest public key wins.

## ListCRDT

An ordered list.

### ListCRDT Operations

```ts
import { ListCrdt } from "tool-db";

const list = new ListCrdt<string>(db.userAccount.getAddress());
list.PUSH("first");
list.PUSH("third");
list.INS("second", 1); // insert before index 1
list.DEL(0); // delete the item at index 0

console.log(list.value); // ["second", "third"]
```

### ListCRDT Resolution

Inserts reference the items next to them, and deletes mark items as deleted
(tombstones), so concurrent inserts and deletes from different users merge.

::: warning Ordering
When users insert at the same place concurrently, every peer ends up with the
same list, but the order may not be the one each author saw.
:::

## CounterCRDT

A number many users can add to and subtract from.

### CounterCRDT Operations

```ts
import { CounterCrdt } from "tool-db";

const counter = new CounterCrdt(db.userAccount.getAddress());
counter.ADD(10);
counter.SUB(3);

console.log(counter.value); // 7
```

### CounterCRDT Resolution

The value is the sum of every change of every author.

## Storing CRDTs

```ts
const map = new MapCrdt<string>(db.userAccount.getAddress());
map.SET("hello", "world");
await db.putCrdt("shared-doc", map);
```

`putCrdt` publishes only the changes you made since your last put, signed as
one change set, and returns `null` if there was nothing new.

## Retrieving CRDTs

```ts
const map = new MapCrdt<string>(db.userAccount.getAddress());
await db.getCrdt("shared-doc", map);

console.log(map.value);
```

`getCrdt` gets every change set of the document from local data and the
relays, verifies them, and merges their changes into your CRDT. To continue
editing a document, get it first, then change it and put it:

```ts
const counter = new CounterCrdt(db.userAccount.getAddress());
await db.getCrdt("visits", counter);
counter.ADD(1);
await db.putCrdt("visits", counter);
```

## Subscribing to CRDT Updates

```ts
const map = new MapCrdt<string>(db.userAccount.getAddress());

db.addKeyListener<MapChanges<string>[]>("shared-doc", (msg) => {
  map.mergeChanges(msg.v); // msg.v has every change of the document
});
await db.subscribeData("shared-doc");
```

## Custom Verification

Custom verificators get each change set: `msg.v` are its changes, and `msg.a`
their (proven) author.

```ts
// Users can only change their own entry of the map
db.addCustomVerification<MapChanges<string>[]>("profiles-map", async (msg) =>
  msg.v.every((change) => change.k === msg.a)
);

// Only additions, no deletions
db.addCustomVerification<MapChanges<string>[]>("guestbook", async (msg) =>
  msg.v.every((change) => change.t !== "DEL")
);
```

CRDTs in a [user namespace](./namespaces.md) only accept changes from the
namespace owner.

## CRDT Change Types

### MapChanges

```ts
type MapChanges<T> =
  | { t: "SET"; a: string; k: string; i: number; v: T }
  | { t: "DEL"; a: string; k: string; i: number };
```

### ListChanges

```ts
type ListChanges<T> =
  | { t: "INS"; i: string; v: T; p?: string; n?: string }
  | { t: "DEL"; i: string; v: string };
```

List indexes (`i`) are `"<author>-<sequence>"`; the author is the part before
the last `-`.

### CounterChanges

```ts
type CounterChanges =
  | { t: "ADD"; a: string; i: number; v: number }
  | { t: "SUB"; a: string; i: number; v: number };
```

## How they are stored

Each change set is a Nostr event (kind `1078`), tagged with the document key
and its CRDT type, and signed by its author. Relays keep every change set, and
a document is all of them merged. See [How it works](./how-it-works.md).

## Performance Considerations

- Change sets are never compacted, so documents keep growing; prefer several
  smaller documents over one big one.
- Every new change set is verified once (one signature check), then cached.
