// ============================================================
// SevenWorld /chest
// Opens the player's Ender Chest inventory.
//
// After closing:
//   - 10-second post-use window starts.
//   - During this window /chest can reopen the GUI.
//   - Closing it again resets the 10-second window.
//
// If the 10-second window expires:
//   - 10-minute cooldown starts.
//
// Timestamps are persisted, so relog/server restart cannot
// bypass the cooldown.
// ============================================================

(function () {
    var POST_USE_MS = 10 * 1000
    var COOLDOWN_MS = 10 * 60 * 1000

    function now() {
        return Date.now()
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
            data.putLong(
                'sevenworld_chest_cooldown_until',
                current + COOLDOWN_MS
            )

            return true
        }

        return false
    }

    ServerEvents.basicCommand('chest', event => {
        var player = event.player
        var data = player.persistentData
        var current = now()

        // First, check whether the 10-second window has expired.
        // If yes, convert it into the 10-minute cooldown.
        finishPostUseIfExpired(player, current)

        var postUseUntil = data.getLong('sevenworld_chest_post_use_until')

        // --------------------------------------------------------
        // 10-second post-use window.
        //
        // IMPORTANT:
        // During this period the chest IS allowed to open again.
        // We do NOT block the command.
        // --------------------------------------------------------

        if (postUseUntil > current) {
            data.putLong('sevenworld_chest_post_use_until', 0)

            player.openInventoryGUI(
                player.getEnderChestInventory(),
                Text.of('Эндер-сундук'),
                9,
                3
            )

            data.putBoolean('sevenworld_chest_opened', true)

            return
        }

        // --------------------------------------------------------
        // 10-minute cooldown.
        // --------------------------------------------------------

        var cooldownUntil = data.getLong('sevenworld_chest_cooldown_until')

        if (cooldownUntil > current) {
            player.tell('§7Эндер-сундук пока недоступен.')
            return
        }

        // --------------------------------------------------------
        // Normal opening.
        // --------------------------------------------------------

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

        // Every time the GUI is closed, start/reset the
        // 10-second post-use window.
        beginPostUse(player)
    })

    PlayerEvents.loggedIn(event => {
        // Prevent a stale flag from causing the first inventory
        // closed after reconnect to trigger the chest timer.
        event.player.persistentData.putBoolean(
            'sevenworld_chest_opened',
            false
        )
    })

    PlayerEvents.tick(event => {
        finishPostUseIfExpired(event.player, now())
    })
})()
