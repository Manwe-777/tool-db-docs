# Listeners API

Listeners allow you to react to data changes in real-time. Tool Db provides several types of listeners for different use cases.

## Key Listeners

Key listeners trigger when data changes for keys matching a prefix.

### `ToolDb.addKeyListener()`

Type signature:

```ts
function addKeyListener<T>(
  key: string,
  fn: (msg: VerificationData<T>) => void
): number;
```

Creates a listener for all keys that start with `key`. Returns a listener ID for later removal.

**Parameters:**

- `key` — The key prefix to listen for
- `fn` — Callback function receiving the full message data

**Returns:** A number ID to remove the listener later.

**Example:**

```ts
// Listen for all chat messages
const listenerId = db.addKeyListener("chat-", (msg) => {
  console.log("New message from:", msg.a);
  console.log("Content:", msg.v);
  console.log("Timestamp:", msg.t);
});

// Listen for a specific key
db.addKeyListener("user-status", (msg) => {
  console.log("User status updated:", msg.v);
});
```

::: tip
Key listeners are debounced according to the `triggerDebouce` option (default: 100ms). This prevents rapid-fire updates from flooding your callbacks.
:::

### `ToolDb.removeKeyListener()`

Type signature:

```ts
function removeKeyListener(id: number): void;
```

Removes the listener with the given ID.

**Example:**

```ts
const listenerId = db.addKeyListener("key", callback);

// Later, remove the listener
db.removeKeyListener(listenerId);
```

::: warning
Always remove listeners when they're no longer needed to prevent memory leaks and unnecessary processing.
:::

### `ToolDb.triggerKeyListener()`

Type signature:

```ts
function triggerKeyListener<T>(key: string, message: VerificationData<T>): void;
```

Manually triggers key listeners for a specific key. Useful for testing or synthetic events.

## ID Listeners

ID listeners trigger once for a specific message ID. Useful for waiting for acknowledgments.

### `ToolDb.addIdListener()`

Type signature:

```ts
function addIdListener(id: string, fn: (msg: ToolDbMessage) => void): void;
```

Creates a one-time listener for a specific message ID.

**Parameters:**

- `id` — The message ID to listen for
- `fn` — Callback function receiving the full message

**Example:**

```ts
// Wait for a response to a specific message
const messageId = "unique-id-123";

db.addIdListener(messageId, (response) => {
  console.log("Got response:", response);
});
```

::: tip
ID listeners are automatically removed after being triggered once. Only one listener per ID is allowed.
:::

### `ToolDb.removeIdListener()`

Type signature:

```ts
function removeIdListener(id: string): void;
```

Removes the ID listener without triggering it.

## Custom Verification

Custom verification functions allow you to add application-specific validation to incoming messages.

### `ToolDb.addCustomVerification()`

Type signature:

```ts
function addCustomVerification<T>(
  key: string,
  fn: (msg: VerificationData<T>, previous: T | undefined) => Promise<boolean>
): number;
```

Creates a custom verification function for all messages matching the key prefix.

**Parameters:**

- `key` — The key prefix to verify
- `fn` — Async function returning `true` to accept, `false` to reject

**Returns:** A number ID to remove the verification later.

**Example:**

```ts
// Only allow updates from specific addresses
async function trustedAuthorsOnly(
  msg: VerificationData<any>,
  previous: any
): Promise<boolean> {
  const trustedAddresses = ["0x123...", "0x456..."];
  return trustedAddresses.includes(msg.a);
}

db.addCustomVerification("admin-", trustedAuthorsOnly);
```

The verification function receives:

1. `msg` — The incoming message with all verification data
2. `previous` — The previously stored value at this key (if any)

### Verification Examples

**Restrict to user namespaces only:**

```ts
async function privateNamespaceOnly(
  msg: VerificationData<any>,
  previous: any
): Promise<boolean> {
  // Only allow keys starting with ":" (private namespace)
  return msg.k.startsWith(":");
}

// Empty key triggers for ALL messages
db.addCustomVerification("", privateNamespaceOnly);
```

**Prevent value deletion:**

```ts
async function noOverwriteWithNull(
  msg: VerificationData<any>,
  previous: any
): Promise<boolean> {
  // Reject if new value is null/undefined and previous exists
  if ((msg.v === null || msg.v === undefined) && previous !== undefined) {
    return false;
  }
  return true;
}

db.addCustomVerification("important-", noOverwriteWithNull);
```

**Schema validation:**

```ts
async function validateUserProfile(
  msg: VerificationData<{ name: string; age: number }>,
  previous: any
): Promise<boolean> {
  const { v: value } = msg;

  // Validate required fields
  if (!value.name || typeof value.name !== "string") return false;
  if (!value.age || typeof value.age !== "number") return false;
  if (value.age < 0 || value.age > 150) return false;

  return true;
}

db.addCustomVerification(":user-profile.", validateUserProfile);
```

**Rate limiting:**

```ts
const messageTimestamps: Record<string, number[]> = {};

async function rateLimitMessages(
  msg: VerificationData<any>,
  previous: any
): Promise<boolean> {
  const author = msg.a;
  const now = Date.now();

  if (!messageTimestamps[author]) {
    messageTimestamps[author] = [];
  }

  // Keep only timestamps from last minute
  messageTimestamps[author] = messageTimestamps[author].filter(
    (t) => now - t < 60000
  );

  // Allow max 10 messages per minute
  if (messageTimestamps[author].length >= 10) {
    return false;
  }

  messageTimestamps[author].push(now);
  return true;
}

db.addCustomVerification("chat-", rateLimitMessages);
```

### `ToolDb.removeCustomVerification()`

Type signature:

```ts
function removeCustomVerification(id: number): void;
```

Removes the custom verification function.

## Complete Example

Here's a complete example combining listeners and verification:

```ts
import { ToolDb, VerificationData } from "tool-db";
import ToolDbWebrtc from "@tool-db/webrtc-network";

const db = new ToolDb({
  networkAdapter: ToolDbWebrtc,
  topic: "my-chat-app",
});

await db.ready;
await db.anonSignIn();

// Track messages for UI
const messages: Array<{ from: string; text: string; time: number }> = [];

// Add key listener for chat messages
const listenerId = db.addKeyListener<{ text: string }>("chat-", (msg) => {
  messages.push({
    from: msg.a,
    text: msg.v.text,
    time: msg.t,
  });
  renderMessages();
});

// Subscribe to receive updates from network
db.subscribeData("chat-");

// Add custom verification to filter spam
db.addCustomVerification<{ text: string }>("chat-", async (msg) => {
  // Reject empty messages
  if (!msg.v.text || msg.v.text.trim() === "") return false;

  // Reject messages over 1000 chars
  if (msg.v.text.length > 1000) return false;

  // Reject messages with banned words
  const bannedWords = ["spam", "scam"];
  const lowerText = msg.v.text.toLowerCase();
  if (bannedWords.some((word) => lowerText.includes(word))) return false;

  return true;
});

// Function to send a message
async function sendMessage(text: string) {
  await db.putData("chat-" + Date.now(), { text });
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  db.removeKeyListener(listenerId);
});
```
