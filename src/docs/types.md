# Types

The main TypeScript types of Tool Db. All of them are exported by `tool-db`.

## ToolDbOptions

See [the constructor](./constructor.md#options).

## NostrEvent

A signed Nostr event (NIP-01). Values, CRDT change sets, profiles and
function calls are all Nostr events.

```ts
interface NostrEvent {
  id: string; // sha256 of the serialized event
  pubkey: string; // author public key
  created_at: number; // seconds
  kind: number;
  tags: string[][];
  content: string;
  sig: string; // Schnorr signature of the id
}

interface EventTemplate {
  kind: number;
  tags: string[][];
  content: string;
  created_at: number;
}
```

## NostrFilter

A subscription filter (NIP-01), used with `db.relays.query()` and
`db.relays.subscribe()`.

```ts
interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [tag: `#${string}`]: string[] | undefined; // like "#d": ["..."]
}
```

## VerificationData

A verified value or CRDT change set, as listeners and custom verificators get
it.

```ts
interface VerificationData<T = any> {
  k: string; // key, with the user namespace if any
  a: string; // author public key
  t: number; // timestamp, in milliseconds
  h: string; // event id
  s: string; // event signature
  v: T; // value, or the changes of a change set
  c: string | null; // CRDT type, null for values
}
```

## VerifyResult

```ts
enum VerifyResult {
  CustomVerificationFailed = "CustomVerificationFailed",
  InvalidData = "InvalidData",
  InvalidTimestamp = "InvalidTimestamp",
  AddressMismatch = "AddressMismatch",
  InvalidSignature = "InvalidSignature",
  Verified = "Verified",
}
```

## NostrCrdtView

A CRDT document, as `getCrdt` returns it and CRDT key listeners get it.

```ts
interface NostrCrdtView<C = any> {
  k: string; // key
  c: string; // CRDT type: "MAP", "LIST" or "COUNTER"
  events: NostrEvent[]; // its signed change sets
  v: C[]; // all their changes
}
```

## Profile

```ts
interface Profile {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  [field: string]: unknown;
}
```

## FunctionReturn

```ts
type FunctionCodes = "OK" | "ERR" | "NOT_FOUND";

type FunctionReturn<R> =
  | { code: "OK"; return: R }
  | { code: "ERR"; return: string }
  | { code: "NOT_FOUND"; return: string };
```

## ServerFunction

```ts
type ServerFunction<R, A = GenericObject> = (
  args: A,
  caller: string // public key of whoever called it
) => Promise<R>;
```

## BaseCrdt

```ts
class BaseCrdt<T = any, Changes = any, Value = any> {
  type: string;
  mergeChanges(changes: Changes[]): void;
  getChanges(): Changes[];
  get value(): Value;
}
```

## MapChanges

```ts
type MapChanges<T> =
  | { t: "SET"; a: string; k: string; i: number; v: T }
  | { t: "DEL"; a: string; k: string; i: number };
```

## ListChanges

```ts
type ListChanges<T> =
  | { t: "INS"; i: string; v: T; p?: string; n?: string } // i: "author-sequence"
  | { t: "DEL"; i: string; v: string }; // v: index of the item to delete
```

## CounterChanges

```ts
type CounterChanges =
  | { t: "ADD"; a: string; i: number; v: number }
  | { t: "SUB"; a: string; i: number; v: number };
```

## Event kinds

| Constant                 | Kind    | Content                                        |
| ------------------------ | ------- | ---------------------------------------------- |
| `VALUE_KIND`             | `30078` | Values (NIP-78 application data, addressable) |
| `CRDT_EVENT_KIND`        | `1078`  | CRDT change sets (regular events)             |
| `PROFILE_KIND`           | `0`     | Profiles (NIP-01)                             |
| `FUNCTION_REQUEST_KIND`  | `21078` | Server function requests (ephemeral)          |
| `FUNCTION_RESPONSE_KIND` | `21079` | Server function responses (ephemeral)         |
