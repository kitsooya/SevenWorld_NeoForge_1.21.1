// ============================================================
// SevenWorld basic utility commands
// /git  - GitHub link, 1 minute cooldown, silent during cooldown
// /eat  - 1 random vanilla cooked meat, once every 24 real hours
// /heal - full health, once every 24 real hours, hunger unchanged
// ============================================================

(function () {
    var GITHUB_URL = 'https://github.com/kitsooya/SevenWorld_NeoForge_1.21.1'
    var DAY_MS = 24 * 60 * 60 * 1000
    var GIT_COOLDOWN_MS = 60 * 1000

    var MEATS = [
        'minecraft:cooked_beef',
        'minecraft:cooked_porkchop',
        'minecraft:cooked_chicken',
        'minecraft:cooked_mutton',
        'minecraft:cooked_rabbit'
    ]

    function now() {
        return Date.now()
    }

    ServerEvents.basicCommand('git', event => {
        var player = event.player
        var data = player.persistentData
        var current = now()
        var nextAllowed = data.getLong('sevenworld_git_next')

        // Intentionally silent while on cooldown.
        if (nextAllowed > current) return

        data.putLong('sevenworld_git_next', current + GIT_COOLDOWN_MS)
        player.tell(GITHUB_URL)
    })

    ServerEvents.basicCommand('eat', event => {
        var player = event.player
        var data = player.persistentData
        var current = now()
        var nextAllowed = data.getLong('sevenworld_eat_next')

        if (nextAllowed > current) {
            player.tell('§7Эта возможность ещё не восстановилась.')
            return
        }

        var meat = MEATS[Math.floor(Math.random() * MEATS.length)]
        player.give(Item.of(meat, 1))
        data.putLong('sevenworld_eat_next', current + DAY_MS)
    })

    ServerEvents.basicCommand('heal', event => {
        var player = event.player
        var data = player.persistentData
        var current = now()
        var nextAllowed = data.getLong('sevenworld_heal_next')

        if (nextAllowed > current) {
            player.tell('§7Ваши раны ещё не готовы затянуться снова.')
            return
        }

        player.setHealth(player.getMaxHealth())
        data.putLong('sevenworld_heal_next', current + DAY_MS)
        player.tell('§aВаши раны затянулись.')
    })
})()
