# ToolDb constructor

## Constructor

Basic constructor. Instantiating will start the adapters and core functions of the database.

Usage;
```js
const node = new ToolDb(options);
```

## Options

```ts
// Database name to use
db: string;

// Show debug console logs
debug: boolean;

// Array of peers to connect to, each one in the form of { host: "127.0.0.1", port: 9000 }
peers: { host: "127.0.0.1", port: 9000 }[];

// Max number of tries when a connection fails
maxRetries: number;

// How long to wait (max) for a debounced key listener recv
triggerDebouce: number;

// How long to wait between retries
wait: number;

// If you want to force a Proof of Work on all messages, set how much (zero is no POW)
pow: number;

// Weter we are a server or not
server: boolean;

// Our hostname (server only)
host: string

// Port to listen incoming connections (server only)
port: number;

// A server instance like Express (server only)
httpServer: HTTPServer | HTTPSServer | undefined;

// Our storage namespace (default is "tooldb")
storageName: string;

// A custom network adapter class
networkAdapter: typeof ToolDbNetworkAdapter;

// A custom storage adapter function
storageAdapter: ToolDbStorageAdapter;

// The namespace/topic of our app
topic: string;

// Peer's ETH Web3 account, generated randomly at startup
peerAccount: Account;
```

## Overridable methods

Every method in the class can be overwriten by your own custom functions, this way you can modify how all functions work, like `getData`, `putData` and even verification trough `verifyMessage`! Although we do not recommend you doing that unless you understand the source code perfectly, beware it is definitely possible to extend the database like this.

There are other methods that dont offer functionality to the class internally, but rather are there to be replaced;

## `onDisconnect`

Will trigger when there are no more peers we are connected to.

Usage:
```js
client.onDisconnect = () => {
  // trigger something on disconnection
  console.log("you are offline");
}
```

## `onConnect`

Will trigger whenever a peer connection is sucessful (could trigger multiple times)

Usage:
```js
client.onConnect = (id: string) => {
  // trigger something on disconnection
  console.log("you are online as " + id);
}
```


