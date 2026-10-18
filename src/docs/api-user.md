# Identity

Every identity is a **Nostr key** (secp256k1, Schnorr signatures). Your
address is your hex public key, the same identity other Nostr apps see.

Tool Db never needs your secret key directly: it asks a **signer** (the
`userAdapter` option) to sign events. Every event is verified with Schnorr
signatures, whatever signer its author used.

| Signer             | Holds the key            | Use it for                                    |
| ------------------ | ------------------------ | --------------------------------------------- |
| `ToolDbNostrUser`  | In memory (default)      | Servers, bots, apps that manage their keys    |
| `ToolDbNip07User`  | A browser extension      | Users with their own Nostr identity (NIP-07)  |

Names come from [profiles](#profiles), and keys never leave their owner.

## Local keys (`ToolDbNostrUser`)

The default signer. A new database starts with a new random key, usable right
away.

### `ToolDb.anonSignIn()`

```ts
function anonSignIn(): Promise<void>;
```

Switches to a new random identity.

### `ToolDb.keysSignIn()`

```ts
function keysSignIn(privateKey: string, username?: string): Promise<unknown>;
```

Signs in with an existing secret key, as hex or `nsec` (NIP-19).

```ts
await db.keysSignIn("nsec1...", "alice");
```

### Saving keys with a password

To keep a key between sessions, encrypt it with a password (NIP-49: scrypt
and XChaCha20-Poly1305) and store the result yourself, for example in
`localStorage`. It is never sent anywhere.

```ts
// Save
const encrypted = await db.userAccount.encryptAccount(password);
localStorage.setItem("account", JSON.stringify(encrypted));
// { name: "alice", ncryptsec: "ncryptsec1..." }

// Restore, rejects with a wrong password
const saved = JSON.parse(localStorage.getItem("account")!);
const account = await db.userAccount.decryptAccount(saved, password);
await db.userAccount.setUser(account, saved.name);
```

`ncryptsec` strings are compatible with other Nostr apps.
`ToolDbNostrUser.encryptionLogN` sets the scrypt cost (default `16`).

### Other methods

```ts
const user = db.userAccount as ToolDbNostrUser;

user.getAddress(); // hex public key
user.getUsername(); // the name given when signing in
user.npub; // public key as npub (NIP-19)
user.exportSecretKey(); // secret key as nsec, handle with care
```

## Browser extensions (`ToolDbNip07User`)

Signs with the user's Nostr browser extension (`window.nostr`, NIP-07), so
your app never sees the secret key.

```ts
import { ToolDb, ToolDbNip07User } from "tool-db";

const db = new ToolDb({ relays, topic: "my-app", userAdapter: ToolDbNip07User });
await db.ready; // loads the public key from the extension
```

- Events returned by the extension are checked to be valid, signed by our
  public key, and exactly what was asked to sign.
- `anonSignIn`, `keysSignIn` and `encryptAccount` reject: the key belongs to
  the extension.
- `db.ready` rejects if there is no extension.

## Profiles

Names and pictures live in Nostr profiles (kind 0 events), shared with every
Nostr app.

### `ToolDb.putProfile()`

```ts
function putProfile(profile: Profile): Promise<NostrEvent>;

interface Profile {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  [field: string]: unknown;
}
```

```ts
await db.putProfile({ name: "alice", about: "Hello!" });
```

### `ToolDb.getProfile()`

```ts
function getProfile(pubkey: string, timeoutMs?: number): Promise<Profile | null>;
```

The newest profile of a user, from local data and the relays. Only profiles
signed by that user are accepted.

## Verified names (NIP-05)

Anyone can write any name in their profile. A NIP-05 identifier
(`name@domain`) is confirmed by the domain, at
`https://domain/.well-known/nostr.json`.

```ts
import { verifyProfileName, resolveNip05, verifyNip05 } from "tool-db";

const profile = await db.getProfile(pubkey);
if (profile && (await verifyProfileName(profile, pubkey))) {
  // profile.nip05 really belongs to pubkey
}

await resolveNip05("alice@example.com"); // { pubkey, relays } or undefined
await verifyNip05("alice@example.com", pubkey); // true or false
```

Redirects are not followed, as the spec requires.

## Encryption

Signers also encrypt and decrypt messages for other public keys (NIP-44):

```ts
const payload = await db.userAccount.nip44Encrypt(bobPubkey, "hi bob");
const text = await bob.userAccount.nip44Decrypt(alicePubkey, payload);
```

See [Encryption](./encryption.md) for group keys.

## Custom signers

Extend `ToolDbUserAdapter` to sign with something else (a hardware key, a
remote signer...). Implement `signEvent`, `getAddress` and, for encryption,
`nip44Encrypt` and `nip44Decrypt`; signers that load their key
asynchronously can also implement `ready`.

::: warning Not available yet
Remote signers (NIP-46, "bunkers") are not supported yet.
:::
