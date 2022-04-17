# Custom adapters

An adapter takes a core functionality of the database and replaces its internals with different code. They are basically plugins, but for specific tasks.

Currently there are only two modules you can write adapters to; [Network](types.html#tooldbnetworkadapter) and [Storage](types.html#tooldbstorageadapter). When writing a new adapter you should follow their types spec and begin with extending those. We *highly* recommend using Typescript for this, as it will make the process of finding bugs a lot simpler. You can also look at the [source code](https://github.com/Manwe-777/tool-db/tree/main/src) for some quick start examples;

Currently for storage there are only two adapters by default, one for browsers (`indexedb`) and another for nodejs (`leveldb`). These are very simple, their only task is to initialize the storage, put data, get it and query the keys (if available).

For network the default adapter is `toolDbNetwork`, it creates WebSocket connections between peers and shares the peers defined as servers troughout the network, therefore, you will always need at least a single server peer to act as a boostrap node, so other peers can join the network. This adapter is also compatible with the [DHT guide](nodejs-dht-discovery.html#nodejs-dht-discovery), although these are usually incompatible with having browsers find nodejs servers to connect to.

In order to provide a connection layer for browsers Tool Db comes with `toolDbWebrtc`, this adapter creates a mesh network between peers using webrtc and webtorrent for peers discovery. This allows browsers to connect to eachother without a central server, and also works in node using [wrtc](https://www.npmjs.com/package/wrtc).

Network adapters are special in the sense they not only handle connections and messages, but can also be responsible of things like peers content routing and deduplication. This creates an infinite amount of posibilities regarding what you can do with a custim adapter!


You can see an example of [Tool Db using WebRtc to create a chat](https://tool-db-chat.on.fleek.co/) _([source code on github](https://github.com/Manwe-777/tool-db-chat))_




[indexedb](https://github.com/Manwe-777/tool-db/blob/main/src/utils/indexedb.ts)

[leveldb](https://github.com/Manwe-777/tool-db/blob/main/src/utils/leveldb.ts)

[toolDbNetwork](https://github.com/Manwe-777/tool-db/blob/main/src/toolDbNetwork.ts)

[toolDbWebrtc](https://github.com/Manwe-777/tool-db/blob/main/src/toolDbWebrtc.ts)


