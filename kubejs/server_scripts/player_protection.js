// ============================================================
// SevenWorld - first join protection
// Resistance I: 5 hours of ONLINE time
// Saturation:   1 hour of ONLINE time
// Relog/death do not reset the timers.
// ============================================================

(function () {
    var RESISTANCE_TICKS = 5 * 60 * 60 * 20
    var SATURATION_TICKS = 1 * 60 * 60 * 20

    PlayerEvents.loggedIn(event => {
        var player = event.player
        var data = player.persistentData

        if (data.getBoolean('sevenworld_first_join_done')) return

        data.putBoolean('sevenworld_first_join_done', true)
        data.putLong('sevenworld_resistance_remaining', RESISTANCE_TICKS)
        data.putLong('sevenworld_saturation_remaining', SATURATION_TICKS)
    })

    PlayerEvents.tick(event => {
        var player = event.player
        var data = player.persistentData

        var resistance = data.getLong('sevenworld_resistance_remaining')
        var saturation = data.getLong('sevenworld_saturation_remaining')

        if (resistance > 0) {
            data.putLong('sevenworld_resistance_remaining', Math.max(0, resistance - 1))

            // Refresh once per second so the vanilla effect does not disappear on relog/death.
            if (player.minecraftPlayer.tickCount % 20 === 0) {
                player.potionEffects.add('minecraft:resistance', Math.min(resistance, 40), 0)
            }
        }

        if (saturation > 0) {
            data.putLong('sevenworld_saturation_remaining', Math.max(0, saturation - 1))

            if (player.minecraftPlayer.tickCount % 20 === 0) {
                player.potionEffects.add('minecraft:saturation', Math.min(saturation, 40), 0)
            }
        }
    })
})()
