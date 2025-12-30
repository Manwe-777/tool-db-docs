# Namespaces

Tool Db uses a key namespace system to organize data and control access. Understanding namespaces is crucial for building secure applications.

## Overview

There are three types of key namespaces:

| Namespace   | Format               | Verification                          |
| ----------- | -------------------- | ------------------------------------- |
| **Public**  | `{key}`              | Basic signature check only            |
| **Private** | `:{publicKey}.{key}` | Must be signed by the namespace owner |
| **Frozen**  | `=={key}`            | First author owns the key permanently |

## Public Namespace

Public namespace stores data at `{key}` without any prefix.

```ts
// Store public data
await db.putData("global-settings", { theme: "dark" });

// Retrieve public data
const settings = await db.getData("global-settings");
```

**Verification:** Only basic message signature and timestamp checks are applied. Anyone with valid credentials can write to public keys.

::: warning
Public namespace is not recommended for user data unless you implement custom verification. Anyone can overwrite public keys!
:::

**Use cases:**

- Shared configuration
- Public announcements
- Data with custom verification rules

## Private Namespace

Private namespace stores data at `:{publicKey}.{key}`, where `{publicKey}` is the author's address.

```ts
// Store user-specific data (userNamespaced = true)
await db.putData("profile", { name: "Alice" }, true);
// Actually stored at: :0x1234...abcd.profile

// Retrieve user data
const profile = await db.getData("profile", true);
```

**Verification:** Messages must be signed by the owner of the namespace. The public key in the namespace must match the message signer.

**Use cases:**

- User profiles
- Personal settings
- Any data that should only be editable by its owner

### Accessing Other Users' Data

You can read any user's private namespace data by constructing the full key:

```ts
// Read another user's public profile
const otherUserKey = `:${otherUserAddress}.profile`;
const theirProfile = await db.getData(otherUserKey);
```

### Helper Method

Use `getUserNamespacedKey()` to get the full key for the current user:

```ts
const fullKey = db.getUserNamespacedKey("settings");
// Returns: ":0x1234...abcd.settings"
```

## Frozen Namespace (Experimental)

Frozen namespace stores data at `=={key}`. The first author to write becomes the permanent owner.

```ts
// Claim a frozen key
await db.putData("==unique-resource", { claimed: true });
```

**Verification:** Compares against previously stored data. Only the original author can make subsequent updates.

::: tip
Frozen namespace is useful for resources that should have permanent ownership, like unique identifiers or claims.
:::

## Key Format Rules

::: warning
Keys should **not** contain dots (`.`) as they are reserved separators for private namespaces.
:::

**Good key names:**

- `user-profile`
- `chat-message-123`
- `settings_v2`

**Bad key names:**

- `user.profile` (dot is reserved)
- `a.b.c` (multiple dots)

## Custom Namespaces

Create your own namespace rules using custom verification:

```ts
// Create an "admin" namespace that only specific addresses can write to
const adminAddresses = ["0x123...", "0x456..."];

db.addCustomVerification("admin:", async (msg) => {
  return adminAddresses.includes(msg.a);
});

// Now only admins can write to admin: keys
await db.putData("admin:config", { setting: true });
```

### Group Namespace Example

```ts
// Members of a group can write to group namespace
const groupMembers = new Set(["0x111...", "0x222...", "0x333..."]);

db.addCustomVerification("group-123:", async (msg) => {
  return groupMembers.has(msg.a);
});
```

### Hierarchical Namespace Example

```ts
// Create organization-based namespaces
// Format: org:{orgId}:member:{userId}:{key}

db.addCustomVerification("org:", async (msg) => {
  const parts = msg.k.split(":");
  if (parts.length < 4) return false;

  const [, orgId, type, userId] = parts;

  // Only the user can write to their own member space
  if (type === "member") {
    return msg.a === userId;
  }

  // Organization admins can write to other spaces
  const orgAdmins = await getOrgAdmins(orgId);
  return orgAdmins.includes(msg.a);
});
```

## Namespace Selection Guide

| Scenario         | Recommended Namespace           |
| ---------------- | ------------------------------- |
| User profile     | Private (`:user.profile`)       |
| User settings    | Private (`:user.settings`)      |
| Global config    | Public with custom verification |
| Chat messages    | Public with rate limiting       |
| Unique claims    | Frozen (`==claim-id`)           |
| Shared resources | Public with group verification  |

## Best Practices

1. **Always use private namespace for user data** — It automatically enforces ownership.

2. **Add custom verification for public keys** — Prevent unauthorized writes.

3. **Use meaningful key prefixes** — Makes querying and filtering easier.

4. **Consider key length** — Very long keys increase storage and bandwidth.

5. **Plan your namespace structure** — It's difficult to migrate data later.

## Example: Full Application

```ts
// Application with multiple namespaces

// User profiles - private namespace
await db.putData("profile", { name: "Alice", bio: "Hello!" }, true);
// Key: :0x123.profile

// User's posts - private namespace with prefix
await db.putData("posts-" + Date.now(), { title: "My Post" }, true);
// Key: :0x123.posts-1234567890

// Public feed - public namespace with verification
db.addCustomVerification("feed-", async (msg) => {
  // Verify author has a registered profile
  const profileKey = `:${msg.a}.profile`;
  const profile = await db.getData(profileKey);
  return profile !== null;
});

// Comments on posts - hierarchical public namespace
// Format: comments-{postId}-{timestamp}
db.addCustomVerification("comments-", async (msg) => {
  // Anyone with a profile can comment
  const profile = await db.getData(`:${msg.a}.profile`);
  return profile !== null;
});
```
