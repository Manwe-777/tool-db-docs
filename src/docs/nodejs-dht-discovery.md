# NodeJs DHT discovery

In a distributed enviroment we dont want to rely on IP adresses or DNS lookups to find our servers, we can do it, but to make applications truly resiliant to censorship we need to have a way to obtain a server without knowing their ip or host beforehand. This is where we use a DHT (distributed hash table).

There are many libraries you can use to mount a connection with a public DHT like bitorrent, in this example I will use [discovery-channel](https://www.npmjs.com/package/discovery-channel).

On the server peers, the ones you want to announce and have other peers connecting to, you need to tell the dht its adress and port.
Ideally you also want to have tool use the same IP adress on its configuration, so it can actually tell other hosts about it.

```js
import { ToolDb, ToolDbLeveldb } from "tool-db";
import DC from "discovery-channel";

const myIp = "127.0.0.1";

const toolDbServer = new ToolDb({
  server: true,
  topic: "myswarmtopic",
  host: myIp,
  port: 9000,
  storageAdapter: ToolDbLeveldb,
});

var channel = DC();
// Join the swarm and provide a port so other peers can reach us
channel.join("myswarmtopic", 9000);

// When the dht obtains a peer
channel.on("peer", (_id: any, peer: any) => {
  console.log(`DHT Peer found! ${peer.host}:${peer.port}`);
  // Avoid connecting to ourselves, but you should also check for duplicates.
  if (myIp !== peer.host) {
    toolDbServer.network.connectTo(peer.host, peer.port);
  }
});
```

For the clients its almost the same process, except you dont want to announce yourself, instead you want to accumulate enough peers and then pass those onto the node constructor. You can also connect to peers as you find them, this will vary depending on your implementation;

```js
import { ToolDb, ToolDbLeveldb } from "tool-db";
import DC from "discovery-channel";

const toolDbClient = new ToolDb({
  server: true,
  topic: "myswarmtopic",
  host: myIp,
  port: 9000,
  storageAdapter: ToolDbLeveldb,
});

const peers = [];

const channel = DC();
// No port, means we do not announce ourselves
channel.join("myswarmtopic");

channel.on("peer", (id, peer) => {
  console.log("Server peer found: ", peer);
  // Check if we havent seen this peer before;
  if (
    !peers
      .map((p) => `${p.host}:${p.port}`)
      .includes(`${peer.host}:${peer.port}`)
  ) {
    peers.push(peer);
    // Connecto to it!
    toolDbClient.network.connectTo(peer.host, peer.port);
  }
});
```

Now every server peer joining the dht will make clients connect to it without a central server or knowing their adress beforehand !