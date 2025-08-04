# Networking Example

A simple demonstration of `bitecs/serialization` for multiplayer networking using WebSockets.

## Install
```
bun install
```

## Run

First, start the server:
```
bun run src/server.ts
```

Then, start up as many clients as you want:
```
bun run src/client.ts
```

## Overview

The example shows three serialization methods:
- **Snapshots** - Full world state
- **Observer** - Only entity changes
- **SoA** - Component-specific data

## Server
The server creates entities with Position, Health, and Network components. It sends serialized updates to connected clients and updates entity positions based on client messages.

## Client 
The client maintains a local copy of the game world, deserializes and applies updates from the server, and logs entity positions after each update.
