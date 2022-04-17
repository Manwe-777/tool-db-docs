# Namespaces spec

## How namespaces work

Tool db being a decentralized key-value database makes a few assumptions on the format of the keys (namespaces) we use to store data, there is basically three types of key namespaces you can use, and the only difference will be the type of verification check that is applied to the incoming data, before it is actually persisted or stored;
- Public namespace
- Private namespace
- Frozen namespace


::: warning
Keys should not contain any dots (`.`), since those are reserved as separator characters for the private namespaces key.
:::

## Public namespace

Public namespace simply stores the data at `{key}`, it does not enforce any verification for the keys, except for the basic messages signature/timestamp checks by default, and it is not recommended to use unless you enforce some custom verifications for those fields, else anyone will be able to edit the data.

## Private namespace

Private namespace stores data at `:{publicKey}.{key}`, this is where you should store all data from users that requires authenthication.

For data to be stored in the private namespace peers will first check against the message containing the payload, the most important check is the signature of the message, that makes it virtually impossible for an attacker to modify the data without creating a signature mismatch.


## Frozen namespace `(in testing)`

Frozen namespace stores data at `=={key}`, Anyone can write here, but the data in this space will only be editable by the original (first) author who stores it, by comparing against previously stored data, if any.

::: tip
You can create your own namespaces implementing [custom verification functions](api-listeners.html#tooldb-addcustomverification)!
:::