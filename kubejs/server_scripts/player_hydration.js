// ============================================================
// SevenWorld - hydration
// Counts only ONLINE server ticks.
// Random Slowness threshold: 4-6 in-game days.
// Warning at 4 days: "Вы чувствуете жажду."
// Final warning at the random threshold: "В горле пересохло..."
// Drinking resets the timer, removes our Slowness and gives
// Speed I for 30 seconds.
// "Вы чувствуете себя лучше." appears only after the 4-day
// warning has already been reached.
// ============================================================

(function () {
    var DAY_TICKS = 24000
    var WARNING_TICKS = 4 * DAY_TICKS
    var MIN_LIMIT = 4 * DAY_TICKS
    var MAX_LIMIT = 6 * DAY_TICKS
    var SPEED_TICKS = 30 * 20

    var ItemUseAnimation = Java.loadClass('net.minecraft.world.item.ItemUseAnimation')

    function randomLimit() {
        return Math.floor(MIN_LIMIT + Math.random() * (MAX_LIMIT - MIN_LIMIT + 1))
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
        if (!stack || stack.empty) return false

        if (stack.hasTag('sevenworld:drinkable')) return true

        try {
            return stack.getItem().getUseAnimation(stack) === ItemUseAnimation.DRINK
        } catch (e) {
            return false
        }
    }

    function resetHydration(player, lateStage) {
        var data = player.persistentData

        data.putLong('sevenworld_hydration_ticks', 0)
        data.putLong('sevenworld_hydration_limit', randomLimit())
        data.putBoolean('sevenworld_hydration_warning4', false)
        data.putBoolean('sevenworld_hydration_slow_applied', false)

        if (lateStage) {
            player.tell('§aВы чувствуете себя лучше.')
        }

        // Stop refreshing only the Slowness created by this system.
        // The last instance expires naturally after a short refresh window.
        data.putBoolean('sevenworld_hydration_slow_applied', false)
        player.potionEffects.add('minecraft:speed', SPEED_TICKS, 0)
    }

    PlayerEvents.tick(event => {
        var player = event.player
        var data = player.persistentData

        // Drink completion tracker. We only reset hydration when the item was actually finished.
        var using = player.minecraftPlayer.isUsingItem()
        var tracked = data.getBoolean('sevenworld_drink_active')

        if (using) {
            var useStack = player.minecraftPlayer.getUseItem()

            if (isDrink(useStack)) {
                data.putBoolean('sevenworld_drink_active', true)
                data.putInt('sevenworld_drink_remaining', player.minecraftPlayer.getUseItemRemainingTicks())
            } else {
                data.putBoolean('sevenworld_drink_active', false)
            }
        } else if (tracked) {
            var remaining = data.getInt('sevenworld_drink_remaining')
            data.putBoolean('sevenworld_drink_active', false)

            // Release before the item finishes is not a drink completion.
            if (remaining <= 1) {
                var ticks = data.getLong('sevenworld_hydration_ticks')
                resetHydration(player, ticks >= WARNING_TICKS)
            }
        }

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

        if (data.getBoolean('sevenworld_hydration_slow_applied') && player.minecraftPlayer.tickCount % 20 === 0) {
            player.potionEffects.add('minecraft:slowness', 40, 0)
        }
    })
})()
