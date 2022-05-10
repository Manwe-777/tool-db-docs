# CRDTs

Currently we implemented our own CRDTs logic for documents, the reason we chose to create our own algorithm versus using existing and tested solutions like Automerge or Yjs is because I needed a simple algorithm that handles only two problems I had while making apps (maps and lists), I found out there was no need to include full JSON documents crdts into the database, and it was overkill to inlcude or support other protocols, which were not blending with the API very well. Also, this way, as developers, we have more control over the data flowing between peers, and we can still use Automerge or Yjs if we want by creating a new extension of the [BaseCrdt](types.html#basecrdt) class like a plugin.

The CRDT class is very simple to use, just spwn a new instance and you can begin making changes to it;

```ts
const pets = new MapCrdt<number>(db.getAddress());
pets.SET("dogs", 1);
pets.SET("cats", 3);
pets.DEL("fish");
```

Each CRDT type has its own setter methods, depending on its usage that will vary!

Once you are all set, just pass the CRDT class to the put method in the db;

```ts
db.putCrdt("my-pets", pets, true);
```

To get a CRDT you can use the get method, it will take care of merging all the changes into the CDRT class you pass to it, while also returning a promise with the changes list;

```ts
db.getCrdt("my-pets", pets, true);
```

You can also add a key listener and subscribe to a CRDT;

```ts
toolDb.addKeyListener<MapChanges<number>[]>(
  db.getUserNamespacedKey(`my-pets`),
  (msg) => {
    if (msg.type === "crdtPut") {
      pets.mergeChanges(msg.v);
    }
  }
);
toolDb.subscribeData(`my-pets`, true);
```

Since all messages in tooldb are handled the same way, and a CRDT update is just a list of changes, you can create a custom verificator to filter unwanted updates from your clients; In this example we are filtering out all the `DEL()` changes from incoming updates, so we dont allow anyone to delete keys from our CRDT.

```ts
function petsVerificator(
  msg: VerificationData<MapChanges<number>[]>
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let isValid = true;
    // Iterate over the crdt changes to find deletions, if any
    // Notice this will filter out the entire message if it contains a DEL,
    // since its not possible to modify the message contents to filter only
    // those changes out, that would break the verification hashes.
    msg.v.forEach((ch) => {
      if (ch.t === "DEL") isValid = false;
    });
    resolve(isValid);
  });
}

// Apply to our user namespaced key, but this works better on public namespaces!
db.addCustomVerification<MapChanges<number>[]>(
  db.getUserNamespacedKey(`my-pets`),
  petsVerificator
);
```