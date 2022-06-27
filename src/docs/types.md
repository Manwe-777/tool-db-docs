# Types

## `VerificationData`

```ts
interface VerificationData<T = any> {
  k: string; // Key/id
  a: string; // address
  n: number; // nonce
  h: string; // hash of JSON.stringify(value) + nonce
  t: number; // Timestamp this was created
  s: string; // signature
  v: T; // value
  c: string | null; // CRDT type (null for regular values)
}
```

## `VerifyResult`

```ts
enum VerifyResult {
  CustomVerificationFailed = "CustomVerificationFailed",
  InvalidData = "InvalidData",
  InvalidVerification = "InvalidVerification",
  CantOverwrite = "CantOverwrite",
  InvalidTimestamp = "InvalidTimestamp",
  AddressMismatch = "AddressMismatch",
  NoProofOfWork = "NoProofOfWork",
  InvalidHashNonce = "InvalidHashNonce",
  InvalidSignature = "InvalidSignature",
  Verified = "Verified",
}
```

## `BaseMessage`

```ts
interface BaseMessage {
  type: MessageType;
  id: string; // unique random id for the message, to ack back
  to: string[]; // who was this message sent to already
}
```

## `Peer`

```ts
interface Peer {
  topic: string;
  timestamp: number;
  host: string;
  port: number;
  adress: string;
  sig: string;
}
```

## `BaseCrdt`

```ts
class BaseCrdt<T = any, Changes = any, Value = any> {
  // Type is a string to allow for custom CRDT classes to be created!
  public type: string = "MAP" | "LIST" | "COUNTER";

  public mergeChanges(changes: Changes[]) {
    //
  }

  public getChanges(): Changes[] {
    return [];
  }

  get value(): Value {
    return "" as any;
  }
}
```
