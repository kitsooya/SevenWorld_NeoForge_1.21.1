// ============================================================
// SevenWorld - sleep fatigue
// Counts only ONLINE time while the player is awake.
// Blindness threshold: random 6-9 in-game days (whole days).
// Warnings happen around 5/6/7 days without mentioning numbers.
// Sleeping resets the cycle and gives Speed I for 5 minutes.
// ============================================================

(function () {
    var DAY_TICKS = 24000
    var WARN_5 = 5 * DAY_TICKS
    var WARN_6 = 6 * DAY_TICKS
    var WARN_7 = 7 * DAY_TICKS
    var MIN_LIMIT_DAYS = 6
    var MAX_LIMIT_DAYS = 9
    var AFTER_SLEEP_SPEED = 5 * 60 * 20

    function randomLimit() {
        var days = MIN_LIMIT_DAYS + Math.floor(Math.random() * (MAX_LIMIT_DAYS - MIN_LIMIT_DAYS + 1))
        return days * DAY_TICKS
    }

    function ensureLimit(data) {
        var limit = data.getLong('sevenworld_sleep_limit')
        if (limit <= 0) {
            limit = randomLimit()
            data.putLong('sevenworld_sleep_limit', limit)
        }
        return limit
    }

    function resetSleepCycle(player) {
        var data = player.persistentData
        var hadSystemBlindness = data.getBoolean('sevenworld_sleep_blind_applied')

        if (hadSystemBlindness) {
            // Our effect is tracked separately. Stop refreshing it and remove it on sleep.
            player.removeEffect('minecraft:blindness')
        }

        data.putLong('sevenworld_sleep_ticks', 0)
        data.putLong('sevenworld_sleep_limit', randomLimit())
        data.putBoolean('sevenworld_sleep_warn5', false)
        data.putBoolean('sevenworld_sleep_warn6', false)
        data.putBoolean('sevenworld_sleep_warn7', false)
        data.putBoolean('sevenworld_sleep_blind_applied', false)
        data.putBoolean('sevenworld_sleep_was_sleeping', false)

        player.tell('§aВас окутывает бодрость.')
        player.potionEffects.add('minecraft:speed', AFTER_SLEEP_SPEED, 0)
    }

    PlayerEvents.tick(event => {
        var player = event.player
        var data = player.persistentData
        var sleeping = player.isSleeping()
        var wasSleeping = data.getBoolean('sevenworld_sleep_was_sleeping')

        if (sleeping) {
            data.putBoolean('sevenworld_sleep_was_sleeping', true)
            return
        }

        if (wasSleeping) {
            resetSleepCycle(player)
            return
        }

        data.putBoolean('sevenworld_sleep_was_sleeping', false)

        var ticks = data.getLong('sevenworld_sleep_ticks')
        var limit = ensureLimit(data)

        if (ticks < limit) {
            ticks++
            data.putLong('sevenworld_sleep_ticks', ticks)
        }

        if (ticks >= WARN_5 && !data.getBoolean('sevenworld_sleep_warn5')) {
            data.putBoolean('sevenworld_sleep_warn5', true)
            player.tell('§7Вы чувствуете усталость...')
        }

        if (ticks >= WARN_6 && !data.getBoolean('sevenworld_sleep_warn6')) {
            data.putBoolean('sevenworld_sleep_warn6', true)
            player.tell('§eВам всё сложнее сохранять бодрость...')
        }

        if (ticks >= WARN_7 && !data.getBoolean('sevenworld_sleep_warn7')) {
            data.putBoolean('sevenworld_sleep_warn7', true)
            player.tell('§6Наступает сонный паралич...')
        }

        if (ticks >= limit && !data.getBoolean('sevenworld_sleep_blind_applied')) {
            data.putBoolean('sevenworld_sleep_blind_applied', true)

            if (!data.getBoolean('sevenworld_sleep_warn7')) {
                data.putBoolean('sevenworld_sleep_warn7', true)
                player.tell('§6Наступает сонный паралич...')
            }

            player.potionEffects.add('minecraft:blindness', 40, 0)
        }

        if (data.getBoolean('sevenworld_sleep_blind_applied') && player.tickCount % 20 === 0) {
            player.potionEffects.add('minecraft:blindness', 40, 0)
        }
    })
})()
