# Base API

## `ToolDb.putData()`

Type signature:

```ts
function putData<T = any>(
  this: ToolDb,
  key: string,
  value: T,
  userNamespaced = false
): Promise<PutMessage<T> | null>
```

Puts some data in the database. It can be any type of data (as long as it can be json encoded), an object, a string, an integer and even booleans.

If `userNamespaced` is set to true, the data will be stored under our public key namespace.

This function will also trigger a message relayed to other server peers to put this data. You can see the final message relayed in the result of the promise (containing the message hash, key, signature, etc)

## `ToolDb.getData()`

Type signature:

```ts
function getData<T = any>(
  this: ToolDb,
  key: string,
  userNamespaced = false,
  timeoutMs = 1000
): Promise<T | null>
```

Gets the data stored at `key`, if it is not found locally it will query any connected peers for it. If `userNamespaced` is set to true, this key will include our public key in the namespace in the form of `:{publicKey}.{key}` as per the keys document.

`timeoutMs` sets the maximum time allowed for the function to wait for other peers responses. The first response will be priorized and returned, but if any subsecuent and more updated data from other peers is obtained _after_ the promise resolves, it will be stored for any later checks.

## `ToolDb.putCrdt()`

Type signature:

```ts
function putCrdt<T = any>(
  this: ToolDb,
  key: string,
  value: BinaryChange[],
  userNamespaced = false
): Promise<CrdtPutMessage | null>
```

Puts the given [Automerge](https://www.npmjs.com/package/automerge) changes (`value`) to the crdt stored at `key`.

If `userNamespaced` is set to true, the data will be stored under our private namespace.


## `ToolDb.getCrdt()`

Type signature:

```ts
function getCrdt(
  this: ToolDb,
  key: string,
  userNamespaced = false,
  timeoutMs = 1000
): Promise<string | null>
```

Gets the given [Automerge](https://www.npmjs.com/package/automerge) document stored at `key` as a base64 encoded binary document. If `userNamespaced` is set to true, the key will include our public key in the namespace in the form of `:{publicKey}.{key}` as per the keys document.

`timeoutMs` sets the maximum time allowed for the function to wait for other peers responses. The first response will be priorized and returned, but if any subsecuent and more updated data from other peers is obtained _after_ the promise resolves, it will be stored for any later checks.

## `ToolDb.queryKeys()`

Type signature:

```ts
function queryKeys(
  this: ToolDb,
  key: string,
  userNamespaced = false,
  timeoutMs = 1000
): Promise<string[] | null>
```

Queries the connected peers for all keys starting with `key`. If `userNamespaced` is set to true, the key will include our public key in the namespace in the form of `:{publicKey}.{key}` as per the keys document.

This function will only return the keys found, and not the data from those keys. This is useful for indexing data, previous to actually obtaining the data.

`timeoutMs` sets the maximum time allowed for the function to wait for other peers responses. The first response will be priorized and returned, but if any subsecuent and more updated data from other peers is obtained _after_ the promise resolves, it will be stored for any later checks.

## `ToolDb.getUserNamespacedKey()`

Type signature:

```ts
function getUserNamespacedKey(key: string): string
```

Transforms a key to be user namespaced as per the key spec.