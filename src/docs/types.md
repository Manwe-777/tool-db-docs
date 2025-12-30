# Types

This page documents the main TypeScript types used throughout Tool Db.

## ToolDbOptions

Configuration options for the ToolDb constructor:

```ts
interface ToolDbOptions {
  debug: boolean;
  peers: { host: string; port: number }[];
  maxRetries: number;
  triggerDebouce: number;
  wait: number;
  pow: number | null;
  server: boolean;
  httpServer: HTTPServer | HTTPSServer | undefined;
  host: string;
  port: number;
  ssl: boolean;
  storageName: string;
  networkAdapter: typeof ToolDbNetworkAdapter;
  storageAdapter: typeof ToolDbStorageAdapter;
  userAdapter: typeof ToolDbUserAdapter;
  topic: string;
  serverName: string | undefined;
  modules: { [module: string]: any };
}
```

## VerificationData

Data attached to every verified message:

```ts
interface VerificationData<T = any> {
  k: string; // Key/id
  a: string; // Author address (public key)
  n: number; // Nonce
  h: string; // Hash of JSON.stringify(value) + nonce
  t: number; // Timestamp when created
  s: string; // Signature
  v: T; // Value/payload
  c: string | null; // CRDT type (null for regular values)
}
```

## VerifyResult

Possible outcomes of message verification:

```ts
enum VerifyResult {
  Verified = "Verified",
  InvalidData = "InvalidData",
  InvalidVerification = "InvalidVerification",
  InvalidSignature = "InvalidSignature",
  InvalidTimestamp = "InvalidTimestamp",
  InvalidHashNonce = "InvalidHashNonce",
  AddressMismatch = "AddressMismatch",
  CantOverwrite = "CantOverwrite",
  NoProofOfWork = "NoProofOfWork",
  CustomVerificationFailed = "CustomVerificationFailed",
}
```

## BaseMessage

Base structure for all network messages:

```ts
interface BaseMessage {
  type: MessageType; // Message type identifier
  id: string; // Unique random ID for acknowledgment
  to: string[]; // List of peers this was already sent to
}
```

## MessageType

All supported message types:

```ts
type MessageType =
  | "ping"
  | "pong"
  | "put"
  | "get"
  | "query"
  | "queryKeys"
  | "subscribe"
  | "crdtGet"
  | "crdtPut"
  | "function";
```

## Peer

Information about a connected peer:

```ts
interface Peer {
  topic: string; // Swarm/topic identifier
  timestamp: number; // When peer info was generated
  host: string; // Hostname or IP
  port: number; // Port number
  address: string; // Peer's public key address
  sig: string; // Signature proving peer identity
}
```

## PutMessage

Message structure for data storage operations:

```ts
interface PutMessage<T = any> extends BaseMessage {
  type: "put";
  data: VerificationData<T>;
}
```

## CrdtPutMessage

Message structure for CRDT storage operations:

```ts
interface CrdtPutMessage extends BaseMessage {
  type: "crdtPut";
  data: VerificationData<any[]>;
}
```

## GetMessage

Message structure for data retrieval requests:

```ts
interface GetMessage extends BaseMessage {
  type: "get";
  key: string;
}
```

## QueryMessage

Message structure for key queries:

```ts
interface QueryMessage extends BaseMessage {
  type: "query" | "queryKeys";
  key: string;
  keys?: string[];
}
```

## SubscribeMessage

Message structure for subscription requests:

```ts
interface SubscribeMessage extends BaseMessage {
  type: "subscribe";
  key: string;
}
```

## FunctionMessage

Message structure for server function calls:

```ts
interface FunctionMessage<A = any> extends BaseMessage {
  type: "function";
  name: string;
  args: A;
}
```

## FunctionReturn

Response structure from server functions:

```ts
type FunctionCodes = "OK" | "ERR" | "NOT_FOUND";

interface FunctionReturnOk<R> {
  code: "OK";
  return: R;
}

interface FunctionReturnErr {
  code: "ERR";
  return: string;
}

interface FunctionReturnNotFound {
  code: "NOT_FOUND";
  return: string;
}

type FunctionReturn<R> =
  | FunctionReturnOk<R>
  | FunctionReturnErr
  | FunctionReturnNotFound;
```

## ServerFunction

Type for defining server-side functions:

```ts
type ServerFunction<R, A = GenericObject> = (
  args: AllowedFunctionArguments<A>
) => Promise<AllowedFunctionReturn<R>>;
```

## Listener

Internal listener structure:

```ts
interface Listener<T = any> {
  key: string;
  timeout: number | null;
  fn: (msg: VerificationData<T>) => void;
}
```

## BaseCrdt

Base class for all CRDT implementations:

```ts
class BaseCrdt<T = any, Changes = any, Value = any> {
  // CRDT type identifier ("MAP", "LIST", "COUNTER", or custom)
  public type: string;

  // Merge incoming changes into this CRDT
  public mergeChanges(changes: Changes[]): void;

  // Get all changes from this CRDT
  public getChanges(): Changes[];

  // Get the computed value
  get value(): Value;
}
```

## MapChanges

Change types for MapCRDT:

```ts
type MapOperations = "SET" | "DEL";

interface ChangeMapBase<T> {
  t: MapOperations; // Operation type
  a: string; // Author address
  k: string; // Key
  i: number; // Index/version
}

interface SetMapChange<T> extends ChangeMapBase<T> {
  t: "SET";
  v: T; // Value
}

interface DelMapChange<T> extends ChangeMapBase<T> {
  t: "DEL";
}

type MapChanges<T> = SetMapChange<T> | DelMapChange<T>;
```

## ListChanges

Change types for ListCRDT:

```ts
type ListOperations = "INS" | "DEL";

interface ChangeListBase<T> {
  t: ListOperations; // Operation type
  i: string; // Unique index (author + sequence)
}

interface InsListChange<T> extends ChangeListBase<T> {
  t: "INS";
  v: T; // Value
  p: string | undefined; // Previous item index
  n: string | undefined; // Next item index
}

interface DelListChange<T> extends ChangeListBase<T> {
  t: "DEL";
  v: string; // Target index to tombstone
}

type ListChanges<T> = InsListChange<T> | DelListChange<T>;
```

## CounterChanges

Change types for CounterCRDT:

```ts
type CounterOperations = "ADD" | "SUB";

interface ChangeCounterBase {
  t: CounterOperations; // Operation type
  v: number; // Value
  a: string; // Author address
  i: number; // Index/sequence
}

interface AddCounterChange extends ChangeCounterBase {
  t: "ADD";
}

interface SubCounterChange extends ChangeCounterBase {
  t: "SUB";
}

type CounterChanges = AddCounterChange | SubCounterChange;
```

## PingMessage

Message for initial peer handshake:

```ts
interface PingMessage extends BaseMessage {
  type: "ping";
  clientId: string;
  isServer: boolean;
  peer: Peer;
}
```

## PongMessage

Response to ping message:

```ts
interface PongMessage extends BaseMessage {
  type: "pong";
  clientId: string;
  isServer: boolean;
  servers: Peer[];
}
```

## ToolDbMessage

Union of all message types:

```ts
type ToolDbMessage =
  | PingMessage
  | PongMessage
  | PutMessage
  | GetMessage
  | QueryMessage
  | SubscribeMessage
  | CrdtPutMessage
  | FunctionMessage;
```

## Utility Types

```ts
type GenericObject = { [key: string]: any };

type AllowedFunctionArguments<A = GenericObject> = A;

type AllowedFunctionReturn<R = unknown> = R;

type ToolDbMessageHandler = (
  message: ToolDbMessage,
  remotePeerId: string
) => void;
```
