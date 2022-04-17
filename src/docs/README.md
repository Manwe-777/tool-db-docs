# Introduction

Tool Db is a decentralized key-value database for peer to peer applications, it can be deployed with minimal setup to create resilient, independent and scalable storage, with no blockchains involved.

Explaining how it works can be difficult without actually understanding some of the concepts tool db wants to enforce;
- Cryptographically secure.
- Offline first.
- Fully decentralized.
- Capable of providing realtime updates.
- Key-value/document storage.
- Works in the Browser and Nodejs seamlessly.

This guide will walk you trough some of the basic concepts of the database and its architecture, as well as specific documentation on each of its functions and built in adapters.

## Language and compatiblity

In order to allow for code readability, ease of use and transpilation the entire library is written in Typescript, therefore some of the code snippets presented in the API documentation will be inevitably written in typescript, though they can be easily converted to Javascript if thats what you are working with.

If you are using javascript (like directly in the browser or with node) then you do not need to worry about anything! transpilation does not restrict our targets compatibility, but some of the libraries we use do (such as browser crypto.subtle modules), therefore be mindful of possible incompatibilities between tool-db and older browsers, the same applies for old nodejs versions (older than 15.x for crypto).

[Web Cryptography browsers support](https://caniuse.com/cryptography)
