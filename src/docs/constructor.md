# ToolDb Constructor

## Basic Usage

Create a new Tool Db instance by calling the constructor with options:

```ts
import { ToolDb } from "tool-db";

const db = new ToolDb({
  topic: "my-app",
  debug: true,
});

// Wait for initialization before using
await db.ready;
```

## Options

All options are optional and have sensible defaults:

```ts
interface ToolDbOptions {
  // Show debug console logs (default: false)
  debug: boolean;

  // Array of peers to connect to on startup
  peers: { host: string; port: number }[];

  // Max number of connection retry attempts (default: 5)
  maxRetries: number;

  // Debounce time for key listener callbacks in ms (default: 100)
  triggerDebouce: number;

  // Time to wait between connection retries in ms (default: 2000)
  wait: number;

  // Proof of Work difficulty (leading zeroes required)
  // Set to 0 for no POW, null to bypass POW entirely (useful for testing)
  pow: number | null;

  // Whether this node is a server/relay (default: false)
  server: boolean;

  // Hostname for server mode (default: "127.0.0.1")
  host: string;

  // Port for server mode (default: 8080)
  port: number;

  // Whether using SSL/TLS (default: false)
  ssl: boolean;

  // HTTP/HTTPS server instance for WebSocket upgrade (server only)
  httpServer: HTTPServer | HTTPSServer | undefined;

  // Storage namespace/database name (default: "tooldb")
  storageName: string;

  // Network adapter class
  networkAdapter: typeof ToolDbNetworkAdapter;

  // Storage adapter class
  storageAdapter: typeof ToolDbStorageAdapter;

  // User authentication adapter class
  userAdapter: typeof ToolDbUserAdapter;

  // Topic/swarm identifier for peer discovery (default: "tool-db-default")
  topic: string;

  // Server name (like a domain identifier)
  serverName: string | undefined;

  // Module-specific options
  modules: {
    [module: string]: any;
  };
}
```

## Configuration Examples

### Minimal Browser Client

```ts
import { ToolDb } from "tool-db";
import ToolDbWebrtc from "@tool-db/webrtc-network";

const db = new ToolDb({
  networkAdapter: ToolDbWebrtc,
  topic: "my-app",
});
```

### Server Node

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbLeveldb from "@tool-db/leveldb-store";

const db = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  storageAdapter: ToolDbLeveldb,
  server: true,
  host: "my-server.com",
  port: 9000,
  ssl: true,
  topic: "my-app",
});
```

### Client with Specific Peers

```ts
const db = new ToolDb({
  peers: [
    { host: "server1.example.com", port: 9000 },
    { host: "server2.example.com", port: 9000 },
  ],
  topic: "my-app",
});
```

### With Express Server

```ts
import express from "express";
import { createServer } from "http";
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";

const app = express();
const httpServer = createServer(app);

const db = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  server: true,
  httpServer: httpServer,
  port: 9000,
  topic: "my-app",
});

httpServer.listen(9000);
```

### With Custom Adapters

```ts
import { ToolDb } from "tool-db";
import CustomNetwork from "./my-network-adapter";
import CustomStorage from "./my-storage-adapter";
import CustomUser from "./my-user-adapter";

const db = new ToolDb({
  networkAdapter: CustomNetwork,
  storageAdapter: CustomStorage,
  userAdapter: CustomUser,
  topic: "my-app",
});
```

## Properties

### `db.ready`

A promise that resolves when the database is fully initialized:

```ts
const db = new ToolDb({ topic: "my-app" });

// Always await ready before using the database
await db.ready;

// Now safe to use
await db.anonSignIn();
```

### `db.isConnected`

Boolean indicating if connected to at least one peer:

```ts
if (db.isConnected) {
  console.log("Online");
} else {
  console.log("Offline");
}
```

### `db.options`

Access the current options:

```ts
console.log("Topic:", db.options.topic);
console.log("Is server:", db.options.server);
```

### `db.network`

Access the network adapter instance:

```ts
// Send to all connected peers
db.network.sendToAll(message);

// Check if a specific peer is connected
if (db.network.isConnected(peerId)) {
  db.network.sendToClientId(peerId, message);
}
```

### `db.store`

Access the storage adapter instance:

```ts
// Direct storage access (usually not needed)
await db.store.put("key", JSON.stringify(data));
const raw = await db.store.get("key");
```

### `db.userAccount`

Access the current user's account adapter:

```ts
const address = db.userAccount.getAddress();
const name = db.userAccount.getUsername();
```

### `db.peerAccount`

Access the peer's identity (separate from user account):

```ts
const peerAddress = db.peerAccount.getAddress();
```

## Event Callbacks

### `db.onConnect`

Called when first connected to any peer:

```ts
db.onConnect = () => {
  console.log("Connected to network!");
  showOnlineStatus();
};
```

### `db.onDisconnect`

Called when disconnected from all peers:

```ts
db.onDisconnect = () => {
  console.log("Disconnected from network");
  showOfflineStatus();
};
```

### `db.onPeerConnect`

Called for each individual peer connection:

```ts
db.onPeerConnect = (peerId: string) => {
  console.log("New peer:", peerId);
  updatePeerCount();
};
```

### `db.onPeerDisconnect`

Called when a peer disconnects:

```ts
db.onPeerDisconnect = (peerId: string) => {
  console.log("Peer left:", peerId);
  updatePeerCount();
};
```

## Methods

### `db.close()`

Properly closes all resources:

```ts
// Always close when done
await db.close();
```

## Server Functions

Define custom server-side functions that clients can call:

```ts
// On server
db.addServerFunction("calculateTotal", async (args: { items: number[] }) => {
  return args.items.reduce((sum, n) => sum + n, 0);
});

// On client
const result = await db.doFunction("calculateTotal", {
  items: [1, 2, 3, 4, 5],
});

if (result.code === "OK") {
  console.log("Total:", result.return); // 15
}
```

::: tip
Server functions execute on the server peer, allowing clients to request complex operations without overloading the network. Implement proper security checks within your functions!
:::
