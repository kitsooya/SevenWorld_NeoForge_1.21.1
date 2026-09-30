// ============================================================
// SevenWorld /chest
// Opens the player's Ender Chest inventory.
//
// After opening:
//   - Ender Chest immediately enters a 5-minute cooldown.
//   - Closing the GUI does NOT affect the cooldown.
//
// Command cooldown:
//   - /chest can only be processed once every 30 seconds.
//   - Repeated attempts during this cooldown do nothing.
//
// During Ender Chest cooldown:
//   - Opening is blocked.
//   - Player receives the actual remaining time.
//
// Timestamps are persisted, so relog/server restart cannot
// bypass the cooldown.
// ============================================================

(function () {
    var CHEST_COOLDOWN_MS = 5 * 60 * 1000
    var COMMAND_COOLDOWN_MS = 30 * 1000

    function now() {
        return Date.now()
    }

    function formatRemaining(ms) {
        var totalSeconds = Math.ceil(ms / 1000)

        var minutes = Math.floor(totalSeconds / 60)
        var seconds = totalSeconds % 60

        if (minutes > 0) {
            if (seconds > 0) {
                return minutes + ' мин. ' + seconds + ' сек.'
            }

            return minutes + ' мин.'
        }

        return seconds + ' сек.'
    }

    ServerEvents.basicCommand('chest', event => {
        var player = event.player
        var data = player.persistentData
        var current = now()

        // --------------------------------------------------------
        // 30-second command cooldown.
        //
        // Repeated calls during this period do absolutely nothing.
        // --------------------------------------------------------

        var commandCooldownUntil = data.getLong(
            'sevenworld_chest_command_cooldown_until'
        )

        if (commandCooldownUntil > current) {
            return
        }

        // Start the 30-second command cooldown immediately.
        data.putLong(
            'sevenworld_chest_command_cooldown_until',
            current + COMMAND_COOLDOWN_MS
        )

        // --------------------------------------------------------
        // 5-minute Ender Chest cooldown.
        // --------------------------------------------------------

        var cooldownUntil = data.getLong(
            'sevenworld_chest_cooldown_until'
        )

        if (cooldownUntil > current) {
            var remaining = cooldownUntil - current

            player.tell(
                '§7Эндер-сундук будет доступен через ' +
                formatRemaining(remaining) +
                '.'
            )

            return
        }

        // --------------------------------------------------------
        // Open Ender Chest.
        // --------------------------------------------------------

        player.openInventoryGUI(
            player.getEnderChestInventory(),
            Text.of('Эндер-сундук'),
            9,
            3
        )

        // --------------------------------------------------------
        // Cooldown starts IMMEDIATELY when the chest is opened.
        // --------------------------------------------------------

        data.putLong(
            'sevenworld_chest_cooldown_until',
            current + CHEST_COOLDOWN_MS
        )
    })

    PlayerEvents.loggedIn(event => {
        // No temporary "opened" flag is required anymore.
        //
        // Both cooldowns are stored in persistentData and therefore
        // survive relogs and server restarts.
    })
})()