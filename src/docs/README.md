# Introduction

Tool Db is a peer-to-peer database inspired by GunDB, combining powerful concepts into one cohesive solution for decentralized applications. It can be deployed with minimal setup to create resilient, independent and scalable storage, with no blockchains involved.

## ✨ Core Features

- **🔐 Cryptographically Secure** — Public/private key authentication with signature verification
- **📴 Offline First** — Works without connectivity, syncs when reconnected
- **🌐 Fully Decentralized** — Federated server mesh with no central point of failure
- **⚡ Real-time Updates** — Subscribe to live data changes across the network
- **📦 Key-Value Storage** — Document-based data model with flexible namespaces
- **🔄 Built-in CRDTs** — Conflict-free replicated data types for automatic conflict resolution

## 🏗️ Architecture

Tool Db embraces **federated servers** — a P2P mesh network where servers join a swarm and manage connections and data sharing, while clients connect to push and receive updates.

> **This is not a requirement!** Any peer can connect to any other peer through WebSockets, and WebRTC connections between web peers are fully supported.

Since anyone can join a federated server swarm, we use **cryptographic validation** (public/private key authentication and signature verification) to ensure all messages come from their real authors. All verification information is stored on each message — no centralized database needed!

## 📦 Monorepo Packages

Tool Db is organized as a monorepo with separate packages for modularity:

| Package             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `tool-db`           | Core database functionality and API                          |
| `ecdsa-user`        | ECDSA-based user authentication and cryptographic operations |
| `web3-user`         | Web3/Ethereum wallet-based user authentication               |
| `leveldb-store`     | LevelDB storage adapter for Node.js                          |
| `indexeddb-store`   | IndexedDB storage adapter for browsers                       |
| `redis-store`       | Redis storage adapter for server deployments                 |
| `websocket-network` | WebSocket network adapter                                    |
| `webrtc-network`    | WebRTC network adapter for browser-to-browser connections    |
| `hybrid-network`    | Hybrid network adapter combining multiple transports         |

## Language and Compatibility

The entire library is written in **TypeScript** for code readability and type safety. The code snippets in this documentation use TypeScript, but they can easily be converted to JavaScript.

### Browser Compatibility

If you're using JavaScript directly in the browser, you don't need to worry about transpilation. However, some crypto modules require modern browsers:

- [Web Cryptography API browser support](https://caniuse.com/cryptography)

### Node.js Requirements

- **Node.js >= 16.0.0** (required for crypto module support)

## 🔗 Related Projects

- 📦 [chain-swarm](https://github.com/Manwe-777/chain-swarm) — Federated server implementation
- 🔍 [discovery-channel](https://www.npmjs.com/package/discovery-channel) — DHT peer discovery
- 💬 [tool-db-chat-example](https://github.com/Manwe-777/tool-db-chat-example) — Live chat demo using WebRTC
