# CRDTs

**CRDT** (Conflict-free Replicated Data Types) are essential for healthy peer-to-peer applications. They handle scattered, unordered updates and ensure all peers eventually converge to the same state, regardless of the order updates are received.

## Built-in CRDT Types

Tool Db includes three CRDT implementations:

| Type | Operations | Use Case |
|------|------------|----------|
| **MapCRDT** | `SET`, `DEL` | Key-value stores with per-key conflict resolution |
| **ListCRDT** | `INS`, `PUSH`, `DEL` | Ordered lists with concurrent insert support |
| **CounterCRDT** | `ADD`, `SUB` | Distributed counters that merge correctly |

## MapCRDT

A key-value map where each key tracks its own version history.

```ts
import { MapCrdt } from "tool-db";

// Create with the author's address
const map = new MapCrdt<number>(db.userAccount.getAddress() || "");

// Set values
map.SET("dogs", 3);
map.SET("cats", 2);
map.SET("birds", 1);

// Delete a key
map.DEL("birds");

// Get the current value
console.log(map.value); // { dogs: 3, cats: 2 }
```

### MapCRDT Operations

- `SET(key: string, value: T)` — Sets a key to a value
- `DEL(key: string)` — Deletes a key

### MapCRDT Resolution

When concurrent updates happen:
1. Changes are sorted by index (version number)
2. For equal indices, SET wins over DEL
3. For equal indices and operation types, author address breaks ties

## ListCRDT

An ordered list that supports concurrent insertions.

```ts
import { ListCrdt } from "tool-db";

const list = new ListCrdt<string>(db.userAccount.getAddress() || "");

// Push items to the end
list.PUSH("first");
list.PUSH("second");

// Insert at a specific position
list.INS("inserted", 1); // Insert at index 1

// Delete by index
list.DEL(0); // Remove first item

console.log(list.value); // ["inserted", "second"]
```

### ListCRDT Operations

- `PUSH(value: T)` — Appends an item to the end
- `INS(value: T, index: number)` — Inserts an item at a specific position
- `DEL(index: number)` — Removes the item at the index (tombstones it)

### ListCRDT Resolution

The list uses position references (prev/next indices) to maintain order during concurrent edits. Deleted items are tombstoned (marked as deleted) rather than removed, ensuring convergence.

## CounterCRDT

A distributed counter that correctly merges additions and subtractions.

```ts
import { CounterCrdt } from "tool-db";

const counter = new CounterCrdt(db.userAccount.getAddress() || "");

// Add to the counter
counter.ADD(10);
counter.ADD(5);

// Subtract from the counter
counter.SUB(3);

console.log(counter.value); // 12
```

### CounterCRDT Operations

- `ADD(value: number)` — Adds to the counter
- `SUB(value: number)` — Subtracts from the counter

### CounterCRDT Resolution

Each operation is tracked with the author and index, preventing duplicate application. All ADD/SUB operations are summed to get the final value.

## Storing CRDTs

Use `putCrdt()` to store CRDT changes:

```ts
const map = new MapCrdt<string>(db.userAccount.getAddress() || "");
map.SET("name", "Alice");
map.SET("status", "online");

// Store in user namespace
await db.putCrdt("my-profile", map, true);
```

## Retrieving CRDTs

Use `getCrdt()` to fetch and merge changes:

```ts
const map = new MapCrdt<string>(db.userAccount.getAddress() || "");

// Fetch and merge changes from network
await db.getCrdt("my-profile", map, true);

console.log(map.value); // { name: "Alice", status: "online" }
```

## Subscribing to CRDT Updates

Combine key listeners with subscriptions for real-time updates:

```ts
import { MapCrdt, MapChanges } from "tool-db";

const sharedMap = new MapCrdt<string>(db.userAccount.getAddress() || "");
const key = db.getUserNamespacedKey("shared-data");

// Listen for incoming changes
db.addKeyListener<MapChanges<string>[]>(key, (msg) => {
  // Merge incoming changes
  sharedMap.mergeChanges(msg.v);
  console.log("Updated:", sharedMap.value);
});

// Subscribe to receive updates
db.subscribeData("shared-data", true);

// Initial fetch
await db.getCrdt("shared-data", sharedMap, true);
```

## Custom Verification

Filter incoming CRDT changes with custom verificators:

```ts
import { MapChanges, VerificationData } from "tool-db";

// Only allow SET operations, reject DEL
function noDeletesAllowed(
  msg: VerificationData<MapChanges<number>[]>
): Promise<boolean> {
  return new Promise((resolve) => {
    const hasDelete = msg.v.some(change => change.t === "DEL");
    resolve(!hasDelete); // Reject if any DEL found
  });
}

// Apply to a key
db.addCustomVerification<MapChanges<number>[]>(
  db.getUserNamespacedKey("protected-data"),
  noDeletesAllowed
);
```

::: warning
Custom verification filters the entire message. If one change in the array fails verification, all changes in that message are rejected (to preserve hash integrity).
:::

## CRDT Change Types

### MapChanges

```ts
type MapOperations = "SET" | "DEL";

interface SetMapChange<T> {
  t: "SET";      // Operation type
  k: string;     // Key
  v: T;          // Value
  a: string;     // Author address
  i: number;     // Index/version
}

interface DelMapChange<T> {
  t: "DEL";
  k: string;
  a: string;
  i: number;
}

type MapChanges<T> = SetMapChange<T> | DelMapChange<T>;
```

### ListChanges

```ts
type ListOperations = "INS" | "DEL";

interface InsListChange<T> {
  t: "INS";                   // Insert operation
  v: T;                       // Value
  i: string;                  // Unique index (author + sequence)
  p: string | undefined;      // Previous item index
  n: string | undefined;      // Next item index
}

interface DelListChange<T> {
  t: "DEL";
  v: string;                  // Target index to tombstone
  i: string;
}

type ListChanges<T> = InsListChange<T> | DelListChange<T>;
```

### CounterChanges

```ts
type CounterOperations = "ADD" | "SUB";

interface CounterChange {
  t: CounterOperations;       // ADD or SUB
  v: number;                  // Value to add/subtract
  a: string;                  // Author address
  i: number;                  // Index/sequence
}
```

## Creating Custom CRDTs

Extend `BaseCrdt` to create custom CRDT types:

```ts
import { BaseCrdt } from "tool-db";

interface MyChange {
  t: "SET";
  v: string;
  a: string;
  i: number;
}

class MyCrdt extends BaseCrdt<string, MyChange, string> {
  public type = "MY_CRDT";
  
  private _changes: MyChange[] = [];
  private _value = "";
  private _author: string;

  constructor(author: string) {
    super();
    this._author = author;
  }

  mergeChanges(changes: MyChange[]) {
    // Add unique changes
    changes.forEach(change => {
      if (!this._changes.some(c => c.i === change.i && c.a === change.a)) {
        this._changes.push(change);
      }
    });
    this.calculate();
  }

  getChanges(): MyChange[] {
    return this._changes;
  }

  get value(): string {
    return this._value;
  }

  private calculate() {
    // Sort and compute value
    this._changes.sort((a, b) => a.i - b.i);
    this._value = this._changes[this._changes.length - 1]?.v || "";
  }

  SET(value: string) {
    const ourChanges = this._changes.filter(c => c.a === this._author);
    this._changes.push({
      t: "SET",
      v: value,
      a: this._author,
      i: ourChanges.length,
    });
    this.calculate();
  }
}
```

## Performance Considerations

- CRDTs store a history of all changes, which grows over time
- Consider periodic compaction for long-lived CRDTs
- MapCRDT only stores the latest version per key after sorting
- ListCRDT tombstones deleted items (they're marked but retained)
- CounterCRDT retains all operations for correct merge behavior

::: tip
For high-frequency updates, consider batching changes and calling `putCrdt()` less frequently.
:::

## Using External CRDT Libraries

You can use libraries like [Automerge](https://automerge.org/) or [Yjs](https://docs.yjs.dev/) by wrapping them in a `BaseCrdt` class:

```ts
import { BaseCrdt } from "tool-db";
import * as Automerge from "@automerge/automerge";

class AutomergeCrdt<T> extends BaseCrdt<T, Uint8Array, T> {
  public type = "AUTOMERGE";
  private doc: Automerge.Doc<T>;

  constructor(initial: T) {
    super();
    this.doc = Automerge.init<T>();
    this.doc = Automerge.change(this.doc, d => Object.assign(d, initial));
  }

  mergeChanges(changes: Uint8Array[]) {
    changes.forEach(change => {
      this.doc = Automerge.applyChanges(this.doc, [change])[0];
    });
  }

  getChanges(): Uint8Array[] {
    return Automerge.getAllChanges(this.doc);
  }

  get value(): T {
    return this.doc;
  }
}
```
