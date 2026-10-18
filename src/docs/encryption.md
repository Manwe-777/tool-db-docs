# Encryption

Everything on Nostr relays is public. To keep data private, encrypt it before
putting it: Tool Db uses **NIP-44** (secp256k1 ECDH, ChaCha20 and HMAC), the
Nostr standard for encrypted payloads.

## Between two users

Signers encrypt and decrypt for another public key:

```ts
// Alice, for Bob
const payload = await alice.userAccount.nip44Encrypt(bobPubkey, "hi bob");
await alice.putData("note-for-bob", payload, true);

// Bob
const stored = await bob.getData<string>(`:${alicePubkey}.note-for-bob`);
const text = await bob.userAccount.nip44Decrypt(alicePubkey, stored!);
```

Only Alice and Bob can decrypt it. With `ToolDbNip07User`, the browser
extension does the encryption, if it supports NIP-44.

## Groups

For a group, share one key between its members:

1. The owner creates a **group key** (a Nostr secret key).
2. The owner **wraps** it for each member (NIP-44 encryption for that member).
3. Members **unwrap** it, and encrypt and decrypt group messages with it.

```ts
import {
  createGroupKey,
  wrapGroupKey,
  unwrapGroupKey,
  encryptForGroup,
  decryptForGroup,
} from "tool-db";

// Owner: create the key, and share it with Bob
const groupKey = createGroupKey();
const forBob = await wrapGroupKey(owner.userAccount, groupKey, bobPubkey);
await owner.putData(`groupKey-${groupId}-${bobPubkey}`, forBob, true);

// Bob: get the key
const wrapped = await bob.getData<string>(
  `:${ownerPubkey}.groupKey-${groupId}-${bobPubkey}`
);
const key = await unwrapGroupKey(bob.userAccount, wrapped!, ownerPubkey);

// Any member: encrypt and decrypt messages
const message = encryptForGroup(key, "hello group");
decryptForGroup(key, message); // "hello group"
```

The [example chat app](https://github.com/Manwe-777/tool-db/tree/main/example)
is built this way.

::: warning Removing members
A removed member keeps the group key they had. To remove someone, create a
new group key and share it with the remaining members.
:::

## Lower level

```ts
import { getConversationKey, nip44Encrypt, nip44Decrypt } from "tool-db";

const conversationKey = getConversationKey(mySecretKey, theirPubkey);
const payload = nip44Encrypt("text", conversationKey);
nip44Decrypt(payload, conversationKey);
```

These are compatible with every NIP-44 implementation, and tested against the
official test vectors.

## What stays public

Encryption hides the content, not the metadata: keys, authors and timestamps
of events are visible to relays and anyone reading them.
