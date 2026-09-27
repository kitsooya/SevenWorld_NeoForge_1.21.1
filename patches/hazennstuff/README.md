# HazennStuff 1.4.0.14 Fix / Patch

Unofficial fix for **HazennStuff 1.4.0.14** on **Minecraft 1.21.1 NeoForge**.

## Problem

When running HazennStuff 1.4.0.14 on a dedicated NeoForge 1.21.1 server, the following error can occur:

```text
Attempted to load class net/minecraft/client/Minecraft for invalid dist DEDICATED_SERVER
```

HazennStuff 1.4.0.14 Fix for Minecraft 1.21.1 NeoForge.
Fixes the Attempted to load class net/minecraft/client/Minecraft for invalid dist DEDICATED_SERVER error on dedicated servers.

This indicates that client-side Minecraft code is being loaded on the dedicated server.

## Compatibility

* Minecraft: `1.21.1`
* Loader: `NeoForge`
* HazennStuff: `1.4.0.14`
* Patch: `1.0.0`

## Installation

1. Make sure **HazennStuff 1.4.0.14** is installed.
2. Download `hazennstuff_patch-1.0.0.jar` from the [Releases](../../releases) section.
3. Place the patch `.jar` into the server's `mods` folder.
4. Start the server.

## What does this patch fix?

This patch is intended to prevent the client-only `net/minecraft/client/Minecraft` class from being loaded in a dedicated server environment.

## Important

This patch does **not** include the original HazennStuff mod.

You must install **HazennStuff 1.4.0.14** separately.

This is an unofficial community patch and is not affiliated with or endorsed by the original HazennStuff developers.

## Keywords

HazennStuff 1.4.0.14 fix, HazennStuff 1.4.0.14 patch, HazennStuf
