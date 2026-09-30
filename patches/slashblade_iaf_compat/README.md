# SlashBlade: Resharped — Ice and Fire Compatibility Patch

Small compatibility patch for **SlashBlade: Resharped 2.0.7** on **NeoForge 1.21.1**.

The patch makes a specific whitelist of **Ice and Fire** entities valid targets for SlashBlade without enabling SlashBlade's global friendly-entity targeting.

## Requirements

* Minecraft 1.21.1
* NeoForge 21.1.249
* SlashBlade: Resharped 2.0.7
* Ice and Fire 2.1.2
* Java 21

## What it changes

The patch modifies SlashBlade's `TargetSelector.AttackablePredicate` through a Mixin.

Only the following Ice and Fire entities are explicitly allowed:

* `iceandfire:fire_dragon`
* `iceandfire:ice_dragon`
* `iceandfire:lightning_dragon`
* `iceandfire:hippogryph`
* `iceandfire:pixie`
* `iceandfire:cyclops`
* `iceandfire:siren`
* `iceandfire:gorgon`
* `iceandfire:deathworm`
* `iceandfire:cockatrice`
* `iceandfire:stymphalian_bird`
* `iceandfire:troll`
* `iceandfire:amphithere`
* `iceandfire:sea_serpent`
* `iceandfire:dread_lich`
* `iceandfire:hydra`
* `iceandfire:hippocampus`
* `iceandfire:ghost`

The whitelist is intentionally limited to these entity IDs.

## What it does NOT change

This patch does **not**:

* enable SlashBlade's global `FRIENDLY_ENABLE` behavior;
* make ordinary friendly mobs attackable;
* make maids attackable;
* modify projectile or arrow targeting;
* modify SlashBlade projectile reflection;
* modify SlashBlade's normal damage or attack mechanics;
* modify Ice and Fire entity AI.

The patch only changes the targetability check for the explicitly listed Ice and Fire entities.

## Installation

1. Install the required Minecraft, NeoForge, SlashBlade: Resharped and Ice and Fire versions.
2. Place the released `sevenworld_slashblade_patch-<version>.jar` into the server's `mods` directory.
3. Remove any older KubeJS script previously used to provide the same SlashBlade/Ice and Fire compatibility behavior.

## Building from source

Clone or download this directory and place the required SlashBlade dependency locally:

```text
libs/SlashBladeResharped-2.0.7-1.21.1.jar
```

Then run:

```powershell
.\gradlew build
```

The resulting JAR will be located in:

```text
build/libs/
```

## Project structure

```text
opensource/
├── build.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
├── gradle/
└── src/
    └── main/
        ├── java/
        │   └── com/sevenworld/slashbladepatch/
        │       ├── SevenWorldSlashBladePatch.java
        │       └── mixin/
        │           └── AttackablePredicateMixin.java
        └── resources/
            ├── META-INF/
            │   └── neoforge.mods.toml
            └── sevenworld_slashblade_patch.mixins.json
```

## License

See [`TEMPLATE_LICENSE.txt`](./TEMPLATE_LICENSE.txt).

This project is an independent compatibility patch and is not an official part of SlashBlade: Resharped or Ice and Fire.
