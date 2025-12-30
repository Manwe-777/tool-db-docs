# Tool Db Documentation

Documentation website for [Tool Db](https://github.com/Manwe-777/tool-db) - A Peer-to-Peer Decentralized Database.

## 📖 View Online

**[https://manwe-777.github.io/tool-db-docs/](https://manwe-777.github.io/tool-db-docs/)**

## 🚀 Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` or `master` branch.

## 🛠️ Local Development

### Prerequisites

- Node.js >= 16.0.0
- Yarn

### Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

The dev server will be available at `http://localhost:8080`.

### Build

```bash
# Build for production
yarn build
```

The built files will be in `src/.vuepress/dist`.

## 📚 Documentation Structure

- **Introduction** — Overview and core concepts
- **Getting Started** — Installation and basic setup
- **Constructor** — Configuration options
- **API**
  - Base API — Core data operations
  - User API — Authentication and identity
  - Listeners — Real-time updates
- **CRDTs** — Conflict-free replicated data types
- **Adapters** — Network, storage, and user adapters
- **Namespaces** — Data organization and access control
- **DHT Discovery** — Serverless peer discovery

## 📦 Related

- [Tool Db](https://github.com/Manwe-777/tool-db) — Main repository
- [Tool Db Chat Example](https://github.com/Manwe-777/tool-db-chat-example) — Live demo

## 📄 License

MIT
