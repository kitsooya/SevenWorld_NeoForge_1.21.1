# HazennStuff 1.4.0.14 Dedicated Server Fix

Unofficial open-source patch for **HazennStuff 1.4.0.14** on **Minecraft 1.21.1 NeoForge**.

This repository contains the source code of the patch used to fix a dedicated-server class-loading error caused by HazennStuff.

## Problem

When running **HazennStuff 1.4.0.14** on a dedicated **Minecraft 1.21.1 NeoForge** server, the following error can occur:

```text
Attempted to load class net/minecraft/client/Minecraft for invalid dist DEDICATED_SERVER
```

This happens when client-only Minecraft code is attempted to be loaded in a dedicated server environment.

## What this project does

This patch is designed to prevent the affected client-only code from being loaded on a dedicated server.

The patch is intended to be used together with the original **HazennStuff 1.4.0.14** mod.

It does not replace or include the original HazennStuff mod.

## Compatibility

* **Minecraft:** 1.21.1
* **Loader:** NeoForge
* **Original mod:** HazennStuff 1.4.0.14
* **Patch version:** 1.0.0

## Source code

The source code is located in:

```text
src/main/java/
src/main/resources/
```

The project uses Gradle and includes the Gradle Wrapper, so the project can be built without installing Gradle separately.

## Building

Clone or download this repository, then run the appropriate Gradle Wrapper command from the project directory.

### Windows

```text
gradlew.bat build
```

### Linux / macOS

```text
./gradlew build
```

The resulting JAR file will be generated in:

```text
build/libs/
```

## Using the compiled patch

The compiled patch is available from the project's GitHub Releases.

Download:

```text
hazennstuff_patch-1.0.0.jar
```

Place the patch JAR into the server's `mods` folder together with the original:

```text
hazennstuff-1.4.0.14.jar
```

## Important

This project does **not** contain the original HazennStuff mod.

You must obtain and install **HazennStuff 1.4.0.14** separately.

This is an unofficial community patch and is not affiliated with, endorsed by, or distributed by the original HazennStuff developers.

## Repository structure

```text
opensource/
├── gradle/
│   └── wrapper/
├── src/
│   └── main/
│       ├── java/
│       └── resources/
├── build.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
└── settings.gradle
```

## Error keywords

This project may be relevant to users searching for:

* HazennStuff 1.4.0.14 error
* HazennStuff 1.4.0.14 fix
* HazennStuff 1.4.0.14 patch
* HazennStuff NeoForge 1.21.1
* HazennStuff dedicated server
* HazennStuff dedicated server crash
* HazennStuff DEDICATED_SERVER
* `Attempted to load class net/minecraft/client/Minecraft for invalid dist DEDICATED_SERVER`
* `net/minecraft/client/Minecraft`
* `invalid dist DEDICATED_SERVER`
* Minecraft 1.21.1 NeoForge dedicated server error

## License

See the license file included in this repository.

## Disclaimer

This project is an unofficial community-created patch.

**HazennStuff** and its associated assets and code belong to their respective authors.

This repository does not claim ownership of the original HazennStuff mod.
