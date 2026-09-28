// ============================================================
// SevenWorld - hydration
// Counts only ONLINE time.
// Slowness threshold: random 4-6 in-game days (whole days).
// At ~4 days: "Вы чувствуете жажду."
// At the actual threshold: "В горле пересохло..."
// Finishing a drink resets hydration, removes our Slowness and
// gives Speed I for 30 seconds.
// "Вы чувствуете себя лучше." appears only after the player
// has already reached the thirst-warning stage.
//
// Drink detection uses NeoForge's Finish event, so a drink is
// counted only after the item has actually been fully consumed.
// A custom #sevenworld:drinkable tag is also supported.
// ============================================================

(function () {
    var DAY_TICKS = 24000
    var WARNING_TICKS = 4 * DAY_TICKS
    var MIN_LIMIT_DAYS = 4
    var MAX_LIMIT_DAYS = 6
    var SPEED_TICKS = 30 * 20

    var UseAnim = Java.loadClass('net.minecraft.world.item.UseAnim')
    var FinishEvent = Java.loadClass('net.neoforged.neoforge.event.entity.living.LivingEntityUseItemEvent$Finish')

    function randomLimit() {
        var days = MIN_LIMIT_DAYS + Math.floor(Math.random() * (MAX_LIMIT_DAYS - MIN_LIMIT_DAYS + 1))
        return days * DAY_TICKS
    }

    function ensureLimit(data) {
        var limit = data.getLong('sevenworld_hydration_limit')
        if (limit <= 0) {
            limit = randomLimit()
            data.putLong('sevenworld_hydration_limit', limit)
        }
        return limit
    }

    function isDrink(stack) {
        if (!stack || stack.isEmpty()) return false

        try {
            if (stack.is('#sevenworld:drinkable')) return true
        } catch (e) {
            // Tag lookup failure should not prevent normal drink detection.
        }

        try {
            return stack.getItem().getUseAnimation(stack) === UseAnim.DRINK
        } catch (e) {
            return false
        }
    }

    function resetHydration(player, lateStage) {
        var data = player.persistentData

        data.putLong('sevenworld_hydration_ticks', 0)
        data.putLong('sevenworld_hydration_limit', randomLimit())
        data.putBoolean('sevenworld_hydration_warning4', false)

        // Do not remove somebody else's Slowness. Our own effect is kept short and
        // refreshed while the fatigue flag is active, so after reset it naturally ends.
        data.putBoolean('sevenworld_hydration_slow_applied', false)

        if (lateStage) {
            player.tell('§aВы чувствуете себя лучше.')
        }

        player.potionEffects.add('minecraft:speed', SPEED_TICKS, 0)
    }

    NativeEvents.onEvent(FinishEvent, event => {
        var player = event.getEntity()
        var stack = event.getItem()

        // KubeJS exposes the vanilla entity type as a string.
        if (player.type !== 'minecraft:player') return
        if (!isDrink(stack)) return

        var data = player.persistentData
        var lateStage = data.getLong('sevenworld_hydration_ticks') >= WARNING_TICKS
        resetHydration(player, lateStage)
    })

    PlayerEvents.tick(event => {
        var player = event.player
        var data = player.persistentData
        var ticks = data.getLong('sevenworld_hydration_ticks')
        var limit = ensureLimit(data)

        if (ticks < limit) {
            ticks++
            data.putLong('sevenworld_hydration_ticks', ticks)
        }

        if (ticks >= WARNING_TICKS && !data.getBoolean('sevenworld_hydration_warning4')) {
            data.putBoolean('sevenworld_hydration_warning4', true)
            player.tell('§eВы чувствуете жажду.')
        }

        if (ticks >= limit && !data.getBoolean('sevenworld_hydration_slow_applied')) {
            data.putBoolean('sevenworld_hydration_slow_applied', true)
            player.potionEffects.add('minecraft:slowness', 40, 0)
            player.tell('§6В горле пересохло...')
        }

        if (data.getBoolean('sevenworld_hydration_slow_applied') && player.tickCount % 20 === 0) {
            player.potionEffects.add('minecraft:slowness', 40, 0)
        }
    })
})()
