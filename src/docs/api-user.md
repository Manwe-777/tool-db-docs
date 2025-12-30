# User API

The user API handles authentication and identity management. All user-related operations use the configured user adapter (default: ECDSA).

## `ToolDb.signUp()`

Type signature:

```ts
async function signUp(
  user: string,
  password: string
): Promise<PutMessage<UserRootData>>;
```

Creates a new user in the database with the given username and password.

**Parameters:**

- `user` — The username to register
- `password` — The password for key encryption

**Returns:** A promise resolving to the put message for the user data.

::: warning
The private keys are stored in the database **encrypted with your password**. If you lose the password, there is no way to recover the private keys. Consider implementing key backup functionality in your application.
:::

**Example:**

```ts
try {
  await db.signUp("alice", "secure-password-123");
  console.log("User created successfully!");
} catch (error) {
  console.error("Sign up failed:", error);
}
```

## `ToolDb.signIn()`

Type signature:

```ts
async function signIn(user: string, password: string): Promise<void>;
```

Signs in with existing credentials. This retrieves the encrypted keys from the database and decrypts them with the password.

**Parameters:**

- `user` — The username to sign in with
- `password` — The password to decrypt the keys

**Returns:** A promise that resolves when sign in is complete.

**Example:**

```ts
try {
  await db.signIn("alice", "secure-password-123");
  console.log("Signed in as:", db.userAccount.getUsername());
  console.log("Address:", db.userAccount.getAddress());
} catch (error) {
  console.error("Sign in failed:", error);
}
```

## `ToolDb.anonSignIn()`

Type signature:

```ts
async function anonSignIn(): Promise<void>;
```

Creates a new, randomized set of keys for anonymous/guest usage. The keys are generated locally but not persisted to the network.

**Returns:** A promise that resolves when the anonymous user is created.

::: tip
Use this for guest access. Users can still write data, which will be stored under their ephemeral public key namespace. If they log out without saving their keys, they won't be able to access that data again.
:::

**Example:**

```ts
await db.anonSignIn();
console.log("Signed in as guest:", db.userAccount.getAddress());
```

::: warning
Anonymous sign in works offline, but `signUp` requires network connectivity to check for username conflicts.
:::

## `ToolDb.keysSignIn()`

Type signature:

```ts
async function keysSignIn(
  privateKey: string,
  username?: string
): Promise<{
  signKeys: CryptoKeyPair;
  encryptionKeys: CryptoKeyPair;
}>;
```

Signs in directly with a private key instead of username/password.

**Parameters:**

- `privateKey` — The private key in hex format
- `username` — Optional username to associate (for display purposes)

**Returns:** A promise resolving to the sign and encryption key pairs.

**Example:**

```ts
// User exports their private key
const privateKey = "0x1234..."; // User's saved private key

await db.keysSignIn(privateKey, "alice");
console.log("Signed in with keys!");
```

::: tip
Use this feature to let users download their keys for backup, or to sign in across multiple devices without remembering passwords.
:::

## `ToolDb.userAccount`

The `userAccount` property provides access to the current user's account adapter.

### `userAccount.getAddress()`

```ts
function getAddress(): string | undefined;
```

Returns the current user's public key/address, or `undefined` if not signed in.

**Example:**

```ts
const address = db.userAccount.getAddress();
if (address) {
  console.log("Signed in as:", address);
} else {
  console.log("Not signed in");
}
```

### `userAccount.getUsername()`

```ts
function getUsername(): string | undefined;
```

Returns the current user's username, or `undefined` if not available.

**Example:**

```ts
const name = db.userAccount.getUsername();
console.log("Hello,", name || "Anonymous");
```

### `userAccount.signData()`

```ts
async function signData(data: string): Promise<string>;
```

Signs data with the user's private key.

**Example:**

```ts
const signature = await db.userAccount.signData("message to sign");
console.log("Signature:", signature);
```

### `userAccount.verifySignature()`

```ts
async function verifySignature(
  message: Partial<VerificationData<any>>
): Promise<boolean>;
```

Verifies a message signature.

**Example:**

```ts
const isValid = await db.userAccount.verifySignature(message);
if (isValid) {
  console.log("Signature is valid!");
}
```

### `userAccount.encryptAccount()`

```ts
async function encryptAccount(password: string): Promise<unknown>;
```

Encrypts the current account with a password for storage.

### `userAccount.decryptAccount()`

```ts
async function decryptAccount(acc: unknown, password: string): Promise<any>;
```

Decrypts an encrypted account with the password.

## Authentication Flow

Here's a typical authentication flow:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebrtc from "@tool-db/webrtc-network";

const db = new ToolDb({
  networkAdapter: ToolDbWebrtc,
  topic: "my-app",
});

// Wait for initialization
await db.ready;

// Check if we have a saved user
if (db.userAccount.getAddress()) {
  console.log("Welcome back,", db.userAccount.getUsername());
} else {
  // New user or guest
  await db.anonSignIn();
  console.log("Signed in as guest");
}

// Later, user wants to create an account
async function createAccount(username: string, password: string) {
  try {
    await db.signUp(username, password);
    console.log("Account created!");
  } catch (error) {
    if (error.message.includes("exists")) {
      console.log("Username already taken");
    }
  }
}

// Or sign in to existing account
async function login(username: string, password: string) {
  try {
    await db.signIn(username, password);
    console.log("Welcome,", db.userAccount.getUsername());
  } catch (error) {
    console.log("Invalid credentials");
  }
}
```
