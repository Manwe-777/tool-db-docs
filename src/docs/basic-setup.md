# Getting started

## Intro

Ideally you want your dApp to work without any central servers, unfortunately to actually start seeding your data across multiple peers, you will need at least one static peer where others can connect to, in case no other peer is online at that moment. This creates a complex paradigm where users should deploy at least some servers to start a decentralized network of peers. Tool Db helps by providing the same API across both client and servers, making them both be just "nodes" in the network.

You can also have your "server" peers be more powerful, static nodes across the network and have your "clients" find those via DHT. This creates a federated structure that is decentralized, more capable of scaling and very fault tolerant.

There are many configs you can use to start a node, in this guide we will use a simple client/server setup, and later we will add a DHT so the clients can find the server without knowing their IP beforehand.

To start a peer in nodejs simply use;

```js
import { ToolDb } from "tool-db";

const server = new ToolDb({
  server: true,
  host: "localhost",
  port: 9000,
});
```

Thats it! notice we are not telling this node _where_ to connect to, but rather just indicating its own adress, so he can later inform about it to other peers. in production you will want to use the actual ip or host from this instance rather than localhost.

::: tip
The reason we need to tag servers, is that they relay data differently between eachother than clients, if you tag all peers as servers, they will inmediately replicate all data they receive troughout the network, probably exceeding the localstorage quota on them very quickly as more peers join the network.
Server peers are suposed to be used only on enviroments where storage is not a problem and to be used as a form of "data replicator" between other server peers. non-server peers will only store the data they are interested in, and will not relay that to peers that did not ask for it.
:::

Now for the nodes connecting to this server the setup is just a little different;

```js
import { ToolDb } from "tool-db";

const client = new ToolDb({
  peers: [{ host: "localhost", port: 9000 }],
  host: "127.0.0.1",
  port: 8000,
});
```

## Use in browsers

To use it on html without packages you can include it with a script tag;

```html
<script src="https://unpkg.com/tool-db/bundle.js"></script>
```

Then just use the `tooldb` global variable as if you were importing it
```js
const { ToolDb, sha256 } = tooldb;
```

## Users

To test everything works we can send a message, but ToolDb is not really a communications protocol (that part is handled by the network adapters), instead what we really care about is storage. We need to tell other peers to put data, give it back to us, subscribe to data changes, etc. All of this is handled by the API in the nodes we just created.

To start adding data we must first authorize ourselves into the network, that means simply creating a set of public and private keys that will become our user identifiers for all data we write. Other peers will then read our messages, with the data we want to write, signed by us, and accept them if they match.
ToolDb offers methods for both sign up and sign in, but for this example we will use anonymous sign in, that will create a random set of keys and give us a random username;

```js
client.anonSignIn().then(console.log);
```

You should see the user data in the console after it sucessfully creates its keys!

::: warning
Anonymous sign in will work offline, just like regular sign in, but sign up requires checking if the username you chose already exists in the network (one peer confirmation) to avoid collisions in the name, therefore it will fail if offline!
We recognize this is not the best approach and we are looking into alternatives to solve this issue.
:::



## Put data

Now we have our user we can finally put some data;

```js
client.putData("testKey", "an amazing value").then(
  () => console.log("Put OK!")
);
```

::: tip
You can nest promises instead of await and catch errors more efficiently!

```js
client.anonSignIn()
  .then(() =>
    client.putData("testKey", "an amazing value").then(() =>
      console.log("Put OK!")
    )
  )
  .catch(console.error);
```
:::

## Get data

Obtaining data from the database is as simple as using the `getData()` method, and we can test that right now on the server peer and retrieve the value our client just inserted, but instead (to make it more interesting) we will add a listener to our newly added key, so whenever the value is modified it will trigger a callback we define. On the server side, add this after the server is instantiated;

```js
server.addKeyListener("testKey", (message) => {
  if (message.type === "put") {
    console.log("Message received! value is " + message.v);
  }
});
```

 