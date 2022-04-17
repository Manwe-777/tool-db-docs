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
): Promise<
  | {
      signKeys: CryptoKeyPair;
      encryptionKeys: CryptoKeyPair;
    }
  | undefined
> 
```

Returns the key pairs for the user stored under alias `user` decrypted with `password`. If the alias is not found or the credentials are invalid it returns `undefined` instead.

## `ToolDb.anonSignIn()`

Type signature:

```ts
function anonSignIn(this: ToolDb): Promise<{
  signKeys: CryptoKeyPair;
  encryptionKeys: CryptoKeyPair;
}>
```

Creates a new, randomized set of keys and stores them in the database as our current logged in user, assigning a random name too, but without storing any of this into the database itself (an ephemereal user)

This can be used to use applications as Guest, so users dont have to log in, but can still use parts of it.

Bear in mind that any user data stored for this user after log in *will be* stored in the database under the public key assigned, and relayed to other peers. So if you log out and you did not save the keys, that data will be be frozen into the peers who stored it.

## `ToolDb.keysSignIn()`

Type signature:

```ts
function keysSignIn(
  this: ToolDb,
  keys: {
    signKeys: CryptoKeyPair;
    encryptionKeys: CryptoKeyPair;
  },
  username?: string
): Promise<{
  signKeys: CryptoKeyPair;
  encryptionKeys: CryptoKeyPair;
}>
```

Like sign in, but instead of providing the password you simply pass the keys to the database. You can provide a username too, but its optional.

You can use this to promt the users to download their keys and use those to log into multiple devices without having to remember their password, or use it as a recovery mechanism as well.


## `ToolDb.getPubKey()`

Type signature:

```ts
function getPubKey(this: ToolDb): Promise<string>
```

Obtain the current logged in user's public key.


## `ToolDb.user`

Type signature:

```ts
interface ToolDbUser: {
  keys: {
    signKeys: CryptoKeyPair;
    encryptionKeys: CryptoKeyPair;
  };
  name: string;
  pubKey: string;
} | undefined
```

You can use this variable to check the user credentials and username.

`client.user.pubKey` contains the Base64 version of the signing public key.

::: tip
You can check if you are logged in by checking `client.user === undefined`
:::

