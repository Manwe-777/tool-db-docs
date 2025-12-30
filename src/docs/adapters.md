# Adapters

Adapters take a core functionality of the database and replace its internals with different implementations. They are essentially plugins for specific tasks.

Tool Db has three types of adapters:

1. **Network Adapters** — Handle peer connections and message routing
2. **Storage Adapters** — Handle data persistence
3. **User Adapters** — Handle authentication and key management

## Network Adapters

Network adapters handle the connection layer between peers.

### WebSocket Network (`websocket-network`)

The WebSocket adapter creates connections between peers and shares server peer information throughout the network. You'll need at least one server peer to act as a bootstrap node.

```bash
npm install @tool-db/websocket-network
```

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";

const db = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  server: true,
  host: "localhost",
  port: 9000,
});
```

### WebRTC Network (`webrtc-network`)

The WebRTC adapter creates a mesh network between peers using WebRTC and WebTorrent trackers for peer discovery. This allows browsers to connect directly to each other without a central server.

```bash
npm install @tool-db/webrtc-network
```

```ts
import { ToolDb } from "tool-db";
import ToolDbWebrtc from "@tool-db/webrtc-network";

const db = new ToolDb({
  networkAdapter: ToolDbWebrtc,
  topic: "my-app-topic",
});
```

**Features:**
- Browser-to-browser P2P connections
- Automatic peer discovery via WebTorrent trackers
- Works in Node.js with the `wrtc` package
- Exponential backoff reconnection
- Online/offline network awareness

### Hybrid Network (`hybrid-network`)

Combines multiple network transports for maximum connectivity.

```bash
npm install @tool-db/hybrid-network
```

```ts
import { ToolDb } from "tool-db";
import ToolDbHybrid from "@tool-db/hybrid-network";

const db = new ToolDb({
  networkAdapter: ToolDbHybrid,
});
```

## Storage Adapters

Storage adapters handle how data is persisted locally.

### LevelDB Store (`leveldb-store`)

For Node.js server environments:

```bash
npm install @tool-db/leveldb-store
```

```ts
import { ToolDb } from "tool-db";
import ToolDbLeveldb from "@tool-db/leveldb-store";

const db = new ToolDb({
  storageAdapter: ToolDbLeveldb,
  storageName: "my-database",
});
```

### IndexedDB Store (`indexeddb-store`)

For browser environments:

```bash
npm install @tool-db/indexeddb-store
```

```ts
import { ToolDb } from "tool-db";
import ToolDbIndexeddb from "@tool-db/indexeddb-store";

const db = new ToolDb({
  storageAdapter: ToolDbIndexeddb,
  storageName: "my-database",
});
```

### Redis Store (`redis-store`)

For server deployments requiring shared storage:

```bash
npm install @tool-db/redis-store
```

```ts
import { ToolDb } from "tool-db";
import ToolDbRedis from "@tool-db/redis-store";

const db = new ToolDb({
  storageAdapter: ToolDbRedis,
  // Configure via modules option
  modules: {
    redis: {
      url: "redis://localhost:6379"
    }
  }
});
```

## User Adapters

User adapters handle authentication and cryptographic operations.

### ECDSA User (`ecdsa-user`)

The default ECDSA-based user authentication using Web Crypto API:

```bash
npm install @tool-db/ecdsa-user
```

```ts
import { ToolDb } from "tool-db";
import EcdsaUser from "@tool-db/ecdsa-user";

const db = new ToolDb({
  userAdapter: EcdsaUser,
});

// Sign up with username and password
await db.signUp("username", "password");

// Sign in
await db.signIn("username", "password");
```

### Web3 User (`web3-user`)

For Ethereum wallet-based authentication:

```bash
npm install @tool-db/web3-user
```

```ts
import { ToolDb } from "tool-db";
import Web3User from "@tool-db/web3-user";

const db = new ToolDb({
  userAdapter: Web3User,
});
```

## Writing Custom Adapters

When writing a new adapter, extend the base adapter class and implement the required methods. We highly recommend using TypeScript for type safety.

### Custom Network Adapter

```ts
import { ToolDb, ToolDbNetworkAdapter } from "tool-db";

export default class MyNetworkAdapter extends ToolDbNetworkAdapter {
  constructor(db: ToolDb) {
    super(db);
    // Initialize your network layer
  }

  // Implement connection methods
}
```

### Custom Storage Adapter

```ts
import { ToolDb, ToolDbStorageAdapter } from "tool-db";

export default class MyStorageAdapter extends ToolDbStorageAdapter {
  constructor(db: ToolDb, forceStorageName?: string) {
    super(db, forceStorageName);
    // Initialize your storage
  }

  async put(key: string, data: string): Promise<void> {
    // Store data
  }

  async get(key: string): Promise<string> {
    // Retrieve data
  }

  async query(key: string): Promise<string[]> {
    // Query keys by prefix
  }
}
```

### Custom User Adapter

```ts
import { ToolDb, ToolDbUserAdapter, VerificationData } from "tool-db";

export default class MyUserAdapter extends ToolDbUserAdapter {
  constructor(db: ToolDb) {
    super(db);
  }

  async anonUser(): Promise<void> {
    // Generate anonymous user keys
  }

  async signData(data: string): Promise<string> {
    // Sign data with private key
  }

  async verifySignature(message: Partial<VerificationData>): Promise<boolean> {
    // Verify message signature
  }

  getAddress(): string | undefined {
    // Return current user's public key/address
  }

  getUsername(): string | undefined {
    // Return current user's name
  }
}
```

## Base Adapter Source

For implementation reference, see the base adapter classes:

- [NetworkAdapter](https://github.com/Manwe-777/tool-db/blob/main/packages/tool-db/lib/adapters-base/networkAdapter.ts)
- [StorageAdapter](https://github.com/Manwe-777/tool-db/blob/main/packages/tool-db/lib/adapters-base/storageAdapter.ts)
- [UserAdapter](https://github.com/Manwe-777/tool-db/blob/main/packages/tool-db/lib/adapters-base/userAdapter.ts)

## Examples

You can see a working example of [Tool Db using WebRTC to create a chat](https://manwe-777.github.io/tool-db-chat-example/) ([source code on GitHub](https://github.com/Manwe-777/tool-db-chat-example))
