// ============================================================
// SevenWorld — SlashBlade × Ice and Fire
//
// Разрешает SlashBlade атаковать выбранные сущности Ice and Fire,
// которые не являются Enemy по Minecraft-классификации.
//
// friendly_enable в SlashBlade остаётся FALSE.
//
// Используется штатный механизм SlashBlade:
// "RevengeAttacker"
//
// ВАЖНО:
// Этот скрипт НЕ разрешает атаки по обычным мирным существам
// и НЕ изменяет projectile/TNT-логику SlashBlade.
// ============================================================

const $LivingEntity = Java.loadClass(
    'net.minecraft.world.entity.LivingEntity'
)

const $ItemSlashBlade = Java.loadClass(
    'mods.flammpfeil.slashblade.item.ItemSlashBlade'
)

const $TargetSelector = Java.loadClass(
    'mods.flammpfeil.slashblade.util.TargetSelector'
)

const $BuiltInRegistries = Java.loadClass(
    'net.minecraft.core.registries.BuiltInRegistries'
)

const REVENGE_TAG = 'RevengeAttacker'

// ============================================================
// Сущности Ice and Fire, соответствующие категориям твоего
// iaf-common.json
// ============================================================

const ICE_AND_FIRE_MOBS = new Set([
    // Dragon
    'iceandfire:fire_dragon',
    'iceandfire:ice_dragon',
    'iceandfire:lightning_dragon',

    // Hippogryphs
    'iceandfire:hippogryph',

    // Pixie
    'iceandfire:pixie',

    // Cyclops
    'iceandfire:cyclops',

    // Siren
    'iceandfire:siren',

    // Gorgon
    'iceandfire:gorgon',

    // Deathworm
    'iceandfire:deathworm',

    // Cockatrice
    'iceandfire:cockatrice',

    // Bird
    'iceandfire:stymphalian_bird',

    // Troll
    'iceandfire:troll',

    // Amphithere
    'iceandfire:amphithere',

    // Sea Serpent
    'iceandfire:sea_serpent',

    // Lich
    'iceandfire:dread_lich',

    // Hydra
    'iceandfire:hydra',

    // Hippocampus
    'iceandfire:hippocampus',

    // Ghost
    'iceandfire:ghost'
])

// ============================================================
// Server tick
// ============================================================

ServerEvents.tick(event => {

    // Один раз в 2 тика достаточно.
    if (event.server.tickCount % 2 !== 0) {
        return
    }

    for (var player of event.server.players) {

        // ----------------------------------------------------
        // Проверяем именно ItemSlashBlade.
        // Никаких проверок по имени класса через includes().
        // ----------------------------------------------------

        var bladeStack = player.getMainHandItem()

        if (bladeStack.isEmpty()) {
            continue
        }

        if (!(bladeStack.getItem() instanceof $ItemSlashBlade)) {
            continue
        }

        // ----------------------------------------------------
        // Используем ТОЧНО ТУ ЖЕ дальность, которую рассчитывает
        // сам SlashBlade.
        // ----------------------------------------------------

        var reach = $TargetSelector.getResolvedReach(player)

        // ----------------------------------------------------
        // Используем ТОЧНО ТУ ЖЕ геометрию AABB, что и SlashBlade.
        // ----------------------------------------------------

        var aabb = $TargetSelector.getResolvedAxisAligned(
            player.getBoundingBox(),
            player.getLookAngle(),
            reach
        )

        // ----------------------------------------------------
        // SlashBlade отдельно ищет multipart-сущности через
        // aabb.inflate(5), поэтому используем тот же запас.
        //
        // Это важно для больших существ Ice and Fire, особенно
        // для драконов.
        // ----------------------------------------------------

        var entities = player.level.getEntitiesOfClass(
            $LivingEntity,
            aabb.inflate(5)
        )

        for (var entity of entities) {

            try {

                // ------------------------------------------------
                // Получаем настоящий registry ID сущности.
                // Пример:
                // iceandfire:fire_dragon
                // ------------------------------------------------

                var entityId = $BuiltInRegistries.ENTITY_TYPE.getKey(
                    entity.getType()
                )

                if (entityId == null) {
                    continue
                }

                var idString = String(entityId)

                // ------------------------------------------------
                // Разрешаем только сущности из нашего списка.
                // ------------------------------------------------

                if (!ICE_AND_FIRE_MOBS.has(idString)) {
                    continue
                }

                // ------------------------------------------------
                // Даём SlashBlade штатный флаг исключения.
                // Его AttackablePredicate сам обнаружит и удалит.
                // ------------------------------------------------

                entity.addTag(REVENGE_TAG)

            } catch (err) {
                // Намеренно ничего не пишем в лог,
                // чтобы не получить спам на каждом тике.
            }
        }
    }
})

console.log(
    '[SevenWorld] SlashBlade × Ice and Fire compatibility loaded.'
)