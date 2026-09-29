// ============================================================
// SevenWorld - first join protection
// Resistance I: 5 hours of ONLINE time
// Saturation:   1 hour of ONLINE time
// Relog/death/server restart do not reset the timers.
// ============================================================

(function () {
    var RESISTANCE_TICKS = 5 * 60 * 60 * 20
    var SATURATION_TICKS = 1 * 60 * 60 * 20
    var REFRESH_TICKS = 20

    function refreshEffects(player, resistance, saturation) {
        if (resistance > 0) {
            player.potionEffects.add('minecraft:resistance', Math.min(resistance, 40), 0)
        }
        if (saturation > 0) {
            player.potionEffects.add('minecraft:saturation', Math.min(saturation, 40), 0)
        }
    }

    PlayerEvents.loggedIn(event => {
        var player = event.player
        var data = player.persistentData

        if (!data.getBoolean('sevenworld_first_join_done')) {
            data.putBoolean('sevenworld_first_join_done', true)
            data.putLong('sevenworld_resistance_remaining', RESISTANCE_TICKS)
            data.putLong('sevenworld_saturation_remaining', SATURATION_TICKS)
        }

        // Re-apply immediately after joining without changing the saved counters.
        refreshEffects(
            player,
            data.getLong('sevenworld_resistance_remaining'),
            data.getLong('sevenworld_saturation_remaining')
        )
    })

    PlayerEvents.tick(event => {
        var player = event.player
        var data = player.persistentData
        var resistance = data.getLong('sevenworld_resistance_remaining')
        var saturation = data.getLong('sevenworld_saturation_remaining')

        if (resistance > 0) {
            resistance--
            data.putLong('sevenworld_resistance_remaining', resistance)
        }

        if (saturation > 0) {
            saturation--
            data.putLong('sevenworld_saturation_remaining', saturation)
        }

        // Refresh every second so death/rejoin cannot make the effect visibly expire.
        if (player.tickCount % REFRESH_TICKS === 0) {
            refreshEffects(player, resistance, saturation)
        }
    })
})()
