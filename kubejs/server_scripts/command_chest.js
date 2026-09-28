// ============================================================
// SevenWorld /chest
// Opens the player's Ender Chest inventory.
// After closing: 10-second post-use window.
// /chest during that window resets it to another 10 seconds.
// When the window ends: 10-minute cooldown starts.
// The timestamps are persisted, so relog/server restart cannot
// bypass the cooldown.
// ============================================================

(function () {
    var POST_USE_MS = 10 * 1000
    var COOLDOWN_MS = 10 * 60 * 1000

    function now() {
        return Date.now()
    }

    function uuidOf(player) {
        return String(player.getUuid())
    }

    function beginPostUse(player) {
        var data = player.persistentData
        var until = now() + POST_USE_MS
        data.putLong('sevenworld_chest_post_use_until', until)
        player.tell('§eЭндер-сундук будет недоступен через 10 секунд.')
    }

    function finishPostUseIfExpired(player, current) {
        var data = player.persistentData
        var postUseUntil = data.getLong('sevenworld_chest_post_use_until')

        if (postUseUntil > 0 && postUseUntil <= current) {
            data.putLong('sevenworld_chest_post_use_until', 0)
            data.putLong('sevenworld_chest_cooldown_until', current + COOLDOWN_MS)
            return true
        }

        return false
    }

    ServerEvents.basicCommand('chest', event => {
        var player = event.player
        var data = player.persistentData
        var current = now()

        finishPostUseIfExpired(player, current)

        var postUseUntil = data.getLong('sevenworld_chest_post_use_until')
        if (postUseUntil > current) {
            // The player is allowed to reset the 10-second post-use window,
            // but the GUI is not reopened during this period.
            data.putLong('sevenworld_chest_post_use_until', current + POST_USE_MS)
            player.tell('§eЭндер-сундук будет недоступен через 10 секунд.')
            return
        }

        var cooldownUntil = data.getLong('sevenworld_chest_cooldown_until')
        if (cooldownUntil > current) {
            player.tell('§7Эндер-сундук пока недоступен.')
            return
        }

        player.openInventoryGUI(
            player.getEnderChestInventory(),
            Text.of('Эндер-сундук'),
            9,
            3
        )
        data.putBoolean('sevenworld_chest_opened', true)
    })

    PlayerEvents.inventoryClosed(event => {
        var player = event.player
        var data = player.persistentData

        if (!data.getBoolean('sevenworld_chest_opened')) return

        data.putBoolean('sevenworld_chest_opened', false)
        beginPostUse(player)
    })

    PlayerEvents.loggedIn(event => {
        // This flag is only meaningful while the current GUI is open.
        // It must not survive a reconnect as a stale "next inventory closed" trigger.
        event.player.persistentData.putBoolean('sevenworld_chest_opened', false)
    })

    PlayerEvents.tick(event => {
        finishPostUseIfExpired(event.player, now())
    })
})()
