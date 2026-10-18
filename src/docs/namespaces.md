# Namespaces

Every key belongs to the `topic` of your app, and is either **shared** or in a
**user namespace**. The namespace decides who can write a key.

## Overview

| Namespace | Key format    | Who can write it        | Example                 |
| --------- | ------------- | ----------------------- | ----------------------- |
| Shared    | `key`         | Anyone                  | `"guestbook"`           |
| User      | `:pubkey.key` | Only the owner (pubkey) | `":ab12….settings"`     |

Rules for who can write a shared key are added with
[custom verificators](./api-listeners.md#custom-verification).

## Shared keys

```ts
await db.putData("guestbook", "Alice was here");
await db.getData("guestbook");
```

Anyone can write a shared key, and the newest value wins. To restrict who
can write it, add a custom verificator:

```ts
import { onlyAuthors } from "tool-db";

db.addCustomVerification("announcements", onlyAuthors([adminPubkey]));
```

## User namespaces

```ts
// Write to your namespace
await db.putData("settings", { theme: "dark" }, true);

// Read your namespace
await db.getData("settings", true);
```

A value in a user namespace is only accepted if it is signed by the owner of
the namespace, so nobody else can write it; clients and relay nodes reject
any other value.

### Accessing Other Users' Data

```ts
const theirSettings = await db.getData(`:${otherPubkey}.settings`);
```

### Helper Method

```ts
db.getUserNamespacedKey("settings"); // ":<your pubkey>.settings"
```

## Topics

The `topic` option separates apps sharing the same relays: keys are stored
as `<topic>:<key>` in Nostr events, and apps only read their own topic.

```ts
new ToolDb({ relays, topic: "my-app" });
```

## Key Format Rules

- Keys can not contain dots (`.`), they separate the namespace from the key
- User namespaces are `:` + a hex public key + `.` + key

## Patterns

### Data owned by one user, shared with others

Keep it in the owner's namespace, so only they can change it:

```ts
// The owner
await db.putData(`group-${id}`, { name: "Friends", members }, true);

// Everyone else
await db.getData(`:${ownerPubkey}.group-${id}`);
```

### Data many users write to

Use a shared [CRDT](./crdts.md), with a verificator for the rules:

```ts
// Users can only add or change their own entry
db.addCustomVerification<MapChanges<string>[]>("requests-", async (msg) =>
  msg.v.every((change) => change.k === msg.a)
);
```

### Hierarchical keys

```ts
await db.putData("posts-2026-10", [...]);
const months = await db.queryKeys("posts-");
```

## Namespace Selection Guide

| You want to store...                   | Use                                        |
| -------------------------------------- | ------------------------------------------ |
| Data of one user                       | User namespace                             |
| Data one user manages, others read     | The manager's user namespace               |
| Data anyone can change                 | Shared key                                 |
| Data some users can change             | Shared key + `onlyAuthors`                 |
| Data many users add to at the same time| Shared CRDT, with verificators for rules   |
| Private data                           | Any of the above, [encrypted](./encryption.md) |
| A user's name                          | Their [profile](./api-user.md#profiles)    |
