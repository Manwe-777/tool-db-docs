# Types

## `VerificationData`

```ts
interface VerificationData<T = any> {
  k: string; // Key/id
  p: string; // public key
  n: number; // nonce
  h: string; // hash of JSON.stringify(value) + nonce
  t: number; // Timestamp this was created
  s: string; // signature
  v: T; // value
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
  PubKeyMismatch = "PubKeyMismatch",
  NoProofOfWork = "NoProofOfWork",
  InvalidHashNonce = "InvalidHashNonce",
  InvalidSignature = "InvalidSignature",
  Verified = "Verified",
}
```

## `UserRootData`

```ts
interface UserRootData {
  keys: {
    skpub: string;
    skpriv: string;
    ekpub: string;
    ekpriv: string;
  };
  iv: string;
  pass: string;
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
  pubkey: string;
  sig: string;
}
```

## `ToolDbNetworkAdapter`

```ts
class ToolDbNetworkAdapter {
  constructor(db: ToolDb) {
    //
  }

  public close(clientId: string): void {
    //
  }

  public sendToAll(
    msg: ToolDbMessage,
    crossServerOnly = false,
    isRelay = false
  ) {
    //
  }

  public sendToClientId(clientId: string, msg: ToolDbMessage) {
    //
  }
}
```

## `ToolDbStorageAdapter`

```ts
interface ToolDbStore {
  start: () => void;
  put: (
    key: string,
    data: string,
    callback: (err: any | null, data?: string) => void
  ) => void;
  get: (
    key: string,
    callback: (err: any | null, data?: string) => void
  ) => void;
  query: (key: string) => Promise<string[]>;
}

type ToolDbStorageAdapter = (dbName?: string) => ToolDbStore;
```