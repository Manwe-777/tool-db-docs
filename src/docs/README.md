# Introduction

Tool Db is a database layer on top of [Nostr](https://nostr.com). Nostr
provides the network (relays), the identity (keys and signers) and the signed
data format (events); Tool Db adds what a database needs on top: keys and
namespaces, CRDTs, custom verification rules, local storage, live
subscriptions and server functions.

::: tip Installing
The packages are published on npm under the `next` tag:
`npm install tool-db@next`.
:::

## ✨ Core Features

- **🔐 Signed data** — every value and CRDT change is signed by its author
  and verified by every reader
- **🌐 Nostr native** — Nostr identities (local keys, browser extensions),
  events and relays
- **📴 Offline First** — data is stored locally and synced with relays
- **⚡ Real-time Updates** — subscribe to keys and get changes live
- **📦 Key-Value Storage** — shared keys and user namespaces
- **🔄 Built-in CRDTs** — maps, lists and counters with provable authors
- **🔒 Encryption** — NIP-44 encryption between users and for groups

## 🏗️ Architecture

```
 browser / node client            relays                   ToolDB relay node
 ┌──────────────────┐        ┌─────────────────┐        ┌──────────────────────┐
 │ ToolDB API       │  WS    │ public Nostr    │        │ Nostr relay          │
 │ verification     │◄──────►│ relays          │        │ + ToolDB validation  │
 │ local storage    │        └─────────────────┘        │ + storage adapter    │
 │ signer (keys)    │◄─────────────────────────────────►│ + server functions   │
 └──────────────────┘                  WS               └──────────────────────┘
```

- **Clients** (browsers or Node) publish to every relay they are connected
  to, and read from all of them.
- **Relays are not trusted**: clients verify everything they receive, so any
  Nostr relay can be used. A malicious relay can hide data, but not forge it.
- **ToolDB relay nodes** are Nostr relays that also validate, store and serve
  your app's data, and run server functions. To clients they are just more
  relays.

## 📦 Packages

| Package                    | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `tool-db`                  | The database: identity, relay pool, values, CRDTs, encryption      |
| `@tool-db/nostr-relay`     | Nostr relay and ToolDB relay node (validation, storage, functions) |
| `@tool-db/leveldb-store`   | LevelDB storage adapter for Node                                   |
| `@tool-db/indexeddb-store` | IndexedDB storage adapter for browsers                             |
| `@tool-db/redis-store`     | Redis storage adapter for Node                                     |

## Language and Compatibility

Tool Db is written in **TypeScript**; the snippets in this documentation use
TypeScript, but work as JavaScript too.

- **Node.js 22+**, which has a global `WebSocket`
- **Browsers**: any modern browser. The core has no Node built ins and only
  pure JS dependencies (`@noble`, `@scure/base`, `events`), so the same code
  runs on Node and in browsers.

## 🔗 Related

- 💬 [Example chat app](https://github.com/Manwe-777/tool-db/tree/main/example) — encrypted group chat
- 📐 [Design document](https://github.com/Manwe-777/tool-db/blob/main/NOSTR_FIRST.md) — how Tool Db maps to Nostr
- 🟣 [Nostr NIPs](https://github.com/nostr-protocol/nips) — the Nostr specifications
