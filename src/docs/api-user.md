# User data

## `ToolDb.signUp()`

Type signature:

```ts
function signUp(
  this: ToolDb,
  user: string,
  password: string
): Promise<PutMessage<UserRootData>>
```

Creates a new user in the database and adds the namespace link to the username key. Notice the private and public keys for this user will be stored in the database encrypted, using your password as the seed for the decryption key, so if the user loses the password there is no effective way to recover the private keys.


## `ToolDb.signIn()`

Type signature:

```ts
function signIn(
  this: ToolDb,
  user: string,
  password: string
): Promise<Account | undefined>
> 
```

Returns a [Web3.eth](https://web3js.readthedocs.io/en/v1.2.11/web3-eth-accounts.html) account for this user, generated based on the key pair stored under alias `user` and decrypted with `password`. If the alias is not found or the credentials are invalid it returns `undefined` instead.

## `ToolDb.anonSignIn()`

Type signature:

```ts
function anonSignIn(this: ToolDb): void
```

Creates a new, randomized set of keys and stores them in the database as our current logged in user, assigning a random name too, but without storing any of this into the database itself (an ephemereal user)

This can be used to use applications as Guest, so users dont have to log in, but can still use parts of it.

Bear in mind that any user data stored for this user after log in *will be* stored in the database under the public key assigned, and relayed to other peers. So if you log out and you did not save the keys, that data will be be frozen into the peers who stored it.

## `ToolDb.keysSignIn()`

Type signature:

```ts
function keysSignIn(
  this: ToolDb,
  privateKey: string,
  username?: string
): Promise<{
  signKeys: CryptoKeyPair;
  encryptionKeys: CryptoKeyPair;
}>
```

Like sign in, but instead of providing the password you simply pass the private key to the database. You can provide a username too, but its optional.

You can use this to promt the users to download their keys and use those to log into multiple devices without having to remember their password, or use it as a recovery mechanism as well.


## `ToolDb.getPubKey()`

Type signature:

```ts
function getPubKey(this: ToolDb): string | undefined
```

Obtain the current logged in user's account adress.

::: tip
You can check if you are logged in by checking `client.getPubKey() === undefined`
:::

## `ToolDb.getUsername()`

Type signature:

```ts
function getUsername(this: ToolDb): string | undefined
```

Obtain the current logged in user's name.


## `ToolDb._user` (now private)

Type signature:

```ts
interface ToolDbUser: {
  account: Account;
  name: string;
} | undefined
```

You can use this variable to check the user account, adress and username.

`client._user.account` contains the user account, a Web3/ETH standard account, containing the keys and web3 methods for managing it.

Please read more about Web3.eth accounts and its utilities [here](https://web3js.readthedocs.io/en/v1.2.11/web3-eth-accounts.html)
