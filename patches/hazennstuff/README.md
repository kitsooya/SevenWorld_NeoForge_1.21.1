# HazennStuff 1.4.0.14 Fix / Patch

Unofficial fix for **HazennStuff 1.4.0.14** on **Minecraft 1.21.1 NeoForge**.

## Problem

When running HazennStuff 1.4.0.14 on a dedicated NeoForge 1.21.1 server, processing the name/text of an affected Curios accessory can cause the following error:

```text
Attempted to load class net/minecraft/client/Minecraft for invalid dist DEDICATED_SERVER
```

The affected code path attempts to load the client-only `net/minecraft/client/Minecraft` class while running on a dedicated server.

Since client classes are not available in the dedicated server environment, the server crashes.

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

The patch changes the name/text handling of the affected HazennStuff Curios accessory.

It prevents the problematic client-only code path from being executed on a dedicated server, avoiding the `net/minecraft/client/Minecraft` loading error.

The original HazennStuff mod is not modified. The patch is loaded separately alongside **HazennStuff 1.4.0.14**.

## How does it work?

The patch uses a **Mixin** to modify the affected method in HazennStuff.

The patched implementation uses the item's existing hover name instead of allowing the original implementation to enter the client-only code path.

## Important

This patch does **not** include the original HazennStuff mod.

You must install **HazennStuff 1.4.0.14** separately.

This is an unofficial community patch and is not affiliated with or endorsed by the original HazennStuff developers.

## Search terms

HazennStuff 1.4.0.14 fix, HazennStuff 1.4.0.14 patch, HazennStuff NeoForge 1.21.1, HazennStuff dedicated server, HazennStuff dedicated server fix, HazennStuff DEDICATED_SERVER, net/minecraft/client/Minecraft, invalid dist DEDICATED_SERVER, Minecraft 1.21.1 dedicated server error, NeoForge dedicated server error, HazennStuff server crash, HazennStuff server error.
