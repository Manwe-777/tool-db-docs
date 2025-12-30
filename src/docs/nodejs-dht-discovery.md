# Node.js DHT Discovery

In a distributed environment, we don't want to rely on hardcoded IP addresses or DNS lookups to find servers. To make applications truly resilient to censorship, we need a way to discover peers without knowing their addresses beforehand. This is where we use a **DHT** (Distributed Hash Table).

## What is DHT Discovery?

A DHT allows peers to find each other by announcing themselves to a distributed network. Instead of connecting to a known server, clients query the DHT for peers advertising a specific "topic" or "info hash".

Popular DHT implementations:

- [discovery-channel](https://www.npmjs.com/package/discovery-channel) — Uses multiple discovery mechanisms
- [hyperswarm](https://github.com/hyperswarm/hyperswarm) — Modern DHT with hole-punching
- BitTorrent DHT — Large, established network

## Server Setup

Servers announce themselves to the DHT so clients can find them:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbLeveldb from "@tool-db/leveldb-store";
import EcdsaUser from "@tool-db/ecdsa-user";
import DC from "discovery-channel";

const MY_IP = "your-server-ip.com"; // Your actual public IP or hostname
const PORT = 9000;
const TOPIC = "my-app-topic";

// Create Tool Db server
const server = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  storageAdapter: ToolDbLeveldb,
  userAdapter: EcdsaUser,
  server: true,
  topic: TOPIC,
  host: MY_IP,
  port: PORT,
});

await server.ready;

// Join the DHT swarm
const channel = DC();

// Announce ourselves with our port
channel.join(TOPIC, PORT);

// When we discover other peers
channel.on("peer", (id: string, peer: { host: string; port: number }) => {
  console.log(`DHT Peer found! ${peer.host}:${peer.port}`);

  // Don't connect to ourselves
  if (MY_IP !== peer.host) {
    server.network.connectTo(peer.host, peer.port);
  }
});

console.log(`Server running on ${MY_IP}:${PORT}`);
console.log(`Announcing on DHT topic: ${TOPIC}`);
```

## Client Setup

Clients discover servers through the DHT without knowing their addresses:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbIndexeddb from "@tool-db/indexeddb-store";
import EcdsaUser from "@tool-db/ecdsa-user";
import DC from "discovery-channel";

const TOPIC = "my-app-topic";

// Create Tool Db client
const client = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  storageAdapter: ToolDbIndexeddb,
  userAdapter: EcdsaUser,
  topic: TOPIC,
  // No initial peers - we'll discover them via DHT
});

await client.ready;

const discoveredPeers: Array<{ host: string; port: number }> = [];

// Join DHT without announcing (no port = passive mode)
const channel = DC();
channel.join(TOPIC);

channel.on("peer", (id: string, peer: { host: string; port: number }) => {
  console.log("Server peer found:", peer);

  // Check if we've seen this peer before
  const peerKey = `${peer.host}:${peer.port}`;
  const alreadyKnown = discoveredPeers.some(
    (p) => `${p.host}:${p.port}` === peerKey
  );

  if (!alreadyKnown) {
    discoveredPeers.push(peer);
    // Connect to the discovered peer
    client.network.connectTo(peer.host, peer.port);
  }
});

console.log(`Discovering peers on topic: ${TOPIC}`);
```

## Best Practices

### Use Consistent Topics

Both servers and clients must use the **exact same topic** to find each other:

```ts
// Good - use a constant
const TOPIC = "my-awesome-app-v1";

// Bad - inconsistent topics won't find each other
// Server: "my-app"
// Client: "myapp"
```

### Handle Multiple Peers

Keep track of discovered peers to avoid duplicate connections:

```ts
const connectedPeers = new Map<string, boolean>();

channel.on("peer", (id, peer) => {
  const peerKey = `${peer.host}:${peer.port}`;

  if (!connectedPeers.has(peerKey)) {
    connectedPeers.set(peerKey, true);
    client.network.connectTo(peer.host, peer.port);
  }
});
```

### Reconnection Logic

DHT discovery continues running, so new peers are found automatically:

```ts
client.onDisconnect = () => {
  console.log("Disconnected - waiting for DHT to find new peers...");
  // DHT will continue discovering peers
};

client.onPeerConnect = (peerId) => {
  console.log("Connected to peer:", peerId);
};
```

## Using Hyperswarm

[Hyperswarm](https://github.com/hyperswarm/hyperswarm) is a modern alternative with better NAT traversal:

```ts
import Hyperswarm from "hyperswarm";
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbLeveldb from "@tool-db/leveldb-store";
import crypto from "crypto";

const TOPIC = "my-app-topic";
const topicBuffer = crypto.createHash("sha256").update(TOPIC).digest();

const swarm = new Hyperswarm();

// Server mode
swarm.join(topicBuffer, { server: true, client: true });

swarm.on("connection", (socket, info) => {
  console.log("New peer connection:", info.publicKey.toString("hex"));

  // Handle the connection...
  // You'll need to bridge this with Tool Db's network layer
});

const server = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  storageAdapter: ToolDbLeveldb,
  server: true,
  port: 9000,
  topic: TOPIC,
});
```

## Browser Considerations

DHT discovery typically requires Node.js due to UDP/TCP networking. For browsers:

1. **Use WebRTC adapter** — Built-in peer discovery via WebTorrent trackers
2. **Hybrid approach** — Use DHT on server, WebSocket on client
3. **Bootstrap nodes** — Maintain a list of known servers for initial connection

```ts
// Browser client connecting to DHT-discovered servers via proxy
const client = new ToolDb({
  networkAdapter: ToolDbWebsocket,
  // These servers were discovered via DHT on the backend
  peers: [
    { host: "discovered-server-1.com", port: 9000 },
    { host: "discovered-server-2.com", port: 9000 },
  ],
  topic: "my-app",
});
```

## Complete Example

Here's a complete example with proper error handling:

```ts
import { ToolDb } from "tool-db";
import ToolDbWebsocket from "@tool-db/websocket-network";
import ToolDbLeveldb from "@tool-db/leveldb-store";
import EcdsaUser from "@tool-db/ecdsa-user";
import DC from "discovery-channel";

interface PeerInfo {
  host: string;
  port: number;
}

class DHTServer {
  private db: ToolDb;
  private channel: any;
  private peers = new Map<string, PeerInfo>();

  constructor(
    private topic: string,
    private host: string,
    private port: number
  ) {
    this.db = new ToolDb({
      networkAdapter: ToolDbWebsocket,
      storageAdapter: ToolDbLeveldb,
      userAdapter: EcdsaUser,
      server: true,
      topic,
      host,
      port,
    });
  }

  async start() {
    await this.db.ready;

    this.channel = DC();
    this.channel.join(this.topic, this.port);

    this.channel.on("peer", (id: string, peer: PeerInfo) => {
      this.handlePeer(peer);
    });

    this.db.onPeerConnect = (peerId) => {
      console.log("Peer connected:", peerId);
    };

    this.db.onPeerDisconnect = (peerId) => {
      console.log("Peer disconnected:", peerId);
    };

    console.log(`Server started on ${this.host}:${this.port}`);
    console.log(`DHT topic: ${this.topic}`);
  }

  private handlePeer(peer: PeerInfo) {
    const key = `${peer.host}:${peer.port}`;

    if (peer.host === this.host && peer.port === this.port) {
      return; // Skip self
    }

    if (!this.peers.has(key)) {
      this.peers.set(key, peer);
      console.log(`Discovered peer: ${key}`);

      try {
        this.db.network.connectTo(peer.host, peer.port);
      } catch (error) {
        console.error(`Failed to connect to ${key}:`, error);
      }
    }
  }

  async stop() {
    if (this.channel) {
      this.channel.leave(this.topic);
    }
    await this.db.close();
  }
}

// Usage
const server = new DHTServer(
  "my-app-v1",
  process.env.HOST || "localhost",
  parseInt(process.env.PORT || "9000")
);

server.start().catch(console.error);

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await server.stop();
  process.exit(0);
});
```
