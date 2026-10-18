# How it works

Tool Db stores everything as Nostr events, so any Nostr relay can carry it,
and other Nostr tools can read it.

## Values

A value is a NIP-78 application data event (kind `30078`), which relays keep
as "the latest per author and key":

```json
{
  "kind": 30078,
  "tags": [["d", "<topic>:<key>"], ["t", "<topic>"]],
  "content": "<JSON value>"
}
```

- **User namespaces** (`:pubkey.key`) only accept events signed by that
  pubkey.
- **Shared keys** can have an event per author; the newest wins (ties go to
  the lowest event id, like NIP-01). Tool Db makes sure your own writes are
  always newer than your previous ones.

## CRDTs

Every change set is a regular event (kind `1078`), kept by relays:

```json
{
  "kind": 1078,
  "tags": [["k", "<topic>:<key>"], ["c", "MAP"], ["t", "<topic>"]],
  "content": "<JSON changes>"
}
```

Every change in it must be authored by the event's pubkey, so authorship of
every change is provable. A document is all its change sets merged.

## Verification

Relays are not trusted: clients verify every event they get (signature, kind,
key, timestamp no more than 30 seconds in the future, namespace, CRDT
authors, custom verificators). A relay can hide data, but not forge it, which
is why clients read from all their relays and merge.

## Other events

| Kind    | What                         | Stored by relays |
| ------- | ---------------------------- | ---------------- |
| `0`     | Profiles                     | Latest           |
| `21078` | Server function requests     | Never            |
| `21079` | Server function responses    | Never            |

Kinds do not need any approval in Nostr; the ones Tool Db uses are not used
by any NIP, and Tool Db events are also identified by their topic tags.

## Local storage

Clients keep every verified event in their storage adapter, so they work
offline and read their own writes right away; relay nodes keep events in an
indexed event store.

## Interoperability

Event ids, signatures, `nsec`/`npub` encoding, NIP-49 password encryption and
NIP-44 encryption are tested against `nostr-tools` and the official test
vectors. A value written by any Nostr library, with the right tags, is a
valid Tool Db value.
