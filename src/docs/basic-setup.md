# Getting Started

## Introduction

Ideally you want your dApp to work without any central servers. However, to start seeding data across multiple peers, you'll need at least one static peer where others can connect in case no other peer is online. This creates a paradigm where users should deploy some servers to bootstrap a decentralized network.

Tool Db helps by providing the same API across both clients and servers, making them both just "nodes" in the network.

You can also have your "server" peers be more powerful, static nodes and have "clients" find them via DHT. This creates a federated structure that is decentralized, scalable, and fault-tolerant.

## Installation

```bash
npm install tool-db
```

For specific adapters, install them separately:

```bash
# Network adapters
npm install @tool-db/websocket-network
npm install @tool-db/webrtc-network

# Storage adapters
npm install @tool-db/leveldb-store   # Node.js
npm install @tool-db/indexeddb-store # Browser

# User adapters
npm install @tool-db/ecdsa-user      # Default ECDSA
npm install @tool-db/web3-user       # Ethereum wallet
```

## Basic Server Setup

To start a server peer in Node.js:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbLeveldb from "@tool-db/leveldb-store";
import EcdsaUser from "@tool-db/ecdsa-user";

const server = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  storageAdapter: ToolDbLeveldb,
  userAdapter: EcdsaUser,
  server: true,
  host: "localhost",
  port: 9000,
  topic: "my-app",
});

// Wait for initialization
await server.ready;
console.log("Server running on port 9000");
```

::: tip
Server peers immediately replicate all data they receive throughout the network. Only use `server: true` on nodes with sufficient storage, as they will store all data from the network.
:::

## Basic Client Setup

For clients connecting to a server:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbIndexeddb from "@tool-db/indexeddb-store";
import EcdsaUser from "@tool-db/ecdsa-user";

const client = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  storageAdapter: ToolDbIndexeddb,
  userAdapter: EcdsaUser,
  peers: [{ host: "localhost", port: 9000 }],
  topic: "my-app",
});

await client.ready;
```

## Browser Setup with WebRTC

For browser-to-browser connections without a server:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebrtc from "@tool-db/webrtc-network";
import ToolDbIndexeddb from "@tool-db/indexeddb-store";
import EcdsaUser from "@tool-db/ecdsa-user";

const db = new ToolDb({
  networkAdapter: ToolDbWebrtc,
  storageAdapter: ToolDbIndexeddb,
  userAdapter: EcdsaUser,
  topic: "my-app",
  debug: true,
});

await db.ready;
```

## Using via CDN

For HTML without a bundler:

```html
<script src="https://unpkg.com/tool-db/bundle.js"></script>
<script>
const { ToolDb, sha256 } = tooldb;

const db = new ToolDb({
  topic: "my-app",
});

db.ready.then(() => {
  console.log("Database ready!");
});
</script>
```

## User Authentication

Before writing data, you need to authenticate. This creates or retrieves your cryptographic keys:

```ts
// Anonymous sign in (for guests)
await db.anonSignIn();
console.log("Guest address:", db.userAccount.getAddress());
```

::: warning
Anonymous sign in works offline, but `signUp()` requires network connectivity to check for username conflicts.
:::

For persistent accounts:

```ts
// Sign up new user
try {
  await db.signUp("username", "password");
  console.log("Account created!");
} catch (e) {
  console.error("Username may already exist");
}

// Sign in existing user
await db.signIn("username", "password");
console.log("Welcome,", db.userAccount.getUsername());
```

## Storing Data

Once authenticated, you can store data:

```ts
// Store public data
await db.putData("my-key", { hello: "world" });
console.log("Data stored!");

// Store user-namespaced (private) data
await db.putData("settings", { theme: "dark" }, true);
```

## Retrieving Data

```ts
// Get public data
const data = await db.getData("my-key");
console.log(data); // { hello: "world" }

// Get user-namespaced data
const settings = await db.getData("settings", true);
console.log(settings); // { theme: "dark" }
```

## Real-time Updates

Subscribe to changes with key listeners:

```ts
// Add a listener for a specific key
const listenerId = db.addKeyListener("chat-messages", (msg) => {
  if (msg.type === "put") {
    console.log("New message:", msg.v);
  }
});

// Subscribe to receive updates from peers
db.subscribeData("chat-messages");

// Later, remove the listener
db.removeKeyListener(listenerId);
```

## Complete Example

Here's a full working example:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebrtc from "@tool-db/webrtc-network";
import ToolDbIndexeddb from "@tool-db/indexeddb-store";
import EcdsaUser from "@tool-db/ecdsa-user";

async function main() {
  // Create database instance
  const db = new ToolDb({
    networkAdapter: ToolDbWebrtc,
    storageAdapter: ToolDbIndexeddb,
    userAdapter: EcdsaUser,
    topic: "my-chat-app",
    debug: true,
  });

  // Wait for initialization
  await db.ready;

  // Sign in anonymously
  await db.anonSignIn();
  console.log("Signed in as:", db.userAccount.getAddress());

  // Subscribe to chat messages
  db.addKeyListener("chat-", (msg) => {
    console.log("Message received:", msg.v);
  });

  // Send a message
  await db.putData("chat-" + Date.now(), {
    from: db.userAccount.getAddress(),
    text: "Hello, world!",
    timestamp: Date.now(),
  });

  console.log("Message sent!");
}

main().catch(console.error);
```

## Connection Events

Monitor connection status:

```ts
// Called when first connected to any peer
db.onConnect = () => {
  console.log("Connected to network!");
};

// Called when disconnected from all peers
db.onDisconnect = () => {
  console.log("Disconnected from network");
};

// Called for each peer connection
db.onPeerConnect = (peerId: string) => {
  console.log("Connected to peer:", peerId);
};

// Called for each peer disconnection
db.onPeerDisconnect = (peerId: string) => {
  console.log("Disconnected from peer:", peerId);
};
```

## Next Steps

- Learn about [CRDTs](crdts.md) for conflict-free collaborative data
- Explore [Namespaces](namespaces.md) for data organization
- Set up [DHT Discovery](nodejs-dht-discovery.md) for serverless peer discovery
- Check the [Constructor Options](constructor.md) for all configuration options
