# Custom adapters

An adapter takes a core functionality of the database and replaces its internals with different code. They are basically plugins, but for specific tasks.

Currently there are three modules you can write adapters to; [Network](https://github.com/Manwe-777/tool-db/blob/main/src/adapters-base/networkAdapter.ts), [Storage](https://github.com/Manwe-777/tool-db/blob/main/src/adapters-base/storageAdapter.ts) and [User](https://github.com/Manwe-777/tool-db/blob/main/src/adapters-base/userAdapter.ts). When writing a new adapter you should follow their types spec and begin with extending those. We *highly* recommend using Typescript for this, as it will make the process of finding bugs a lot simpler. You can also look at the [source code](https://github.com/Manwe-777/tool-db/tree/main/src) for some quick start examples; (check below for specific implementations)

Currently for storage there are only two adapters by default, one for browsers (`indexedb`) and another for nodejs (`leveldb`). These are very simple, their only task is to initialize the storage, put data, get it and query the keys (if available).

For network the default adapter is `toolDbWebsocket`, it creates WebSocket connections between peers and shares the peers defined as servers troughout the network, therefore, you will always need at least a single server peer to act as a boostrap node, so other peers can join. This adapter is also compatible with the [DHT guide](nodejs-dht-discovery.html#nodejs-dht-discovery), although these are usually incompatible with having browsers find nodejs servers to connect to.

In order to provide a connection layer for browsers Tool Db comes with `toolDbWebrtc`, this adapter creates a mesh network between peers using webrtc and webtorrent for peers discovery. This allows browsers to connect to eachother without a central server, and also works in node using [wrtc](https://www.npmjs.com/package/wrtc). Network adapters are special in the sense they not handle connections, messages, and content routing/deduplication. 

User adapters can do a lot of things, most importantly they handle signing and storage of key pairs; But you can make it so they connect to a wallet or service that provides those features instead, for an extra layer of security.

You can see an example of [Tool Db using WebRtc to create a chat](https://tool-db-chat.on.fleek.co/) _([source code on github](https://github.com/Manwe-777/tool-db-chat))_


- Storage adapters:

[Indexedb](https://github.com/Manwe-777/tool-db/blob/main/src/adapters/toolDbIndexedb.ts)

[Level](https://github.com/Manwe-777/tool-db/blob/main/src/adapters/toolDbLeveldb.ts)

- Network adapters:

[Websocket](https://github.com/Manwe-777/tool-db/blob/main/src/adapters/toolDbWebsocket.ts)

[Webrtc](https://github.com/Manwe-777/tool-db/blob/main/src/adapters/toolDbWebrtc.ts)

- User/keys adapters:

[Web3.eth User](https://github.com/Manwe-777/tool-db/blob/main/src/adapters/toolDbWeb3User.ts)

