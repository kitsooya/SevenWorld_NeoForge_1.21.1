// ============================================================
// SevenWorld /chest
// Opens the player's real Ender Chest.
// After closing: 10-second post-use window.
// Typing /chest during that window resets it to 10 seconds.
// When the window ends: 10-minute cooldown starts.
// ============================================================

(function () {
    var POST_USE_MS = 10 * 1000
    var COOLDOWN_MS = 10 * 60 * 1000
    var activeClosures = new Map()

    function now() {
        return Date.now()
    }

    function uuidOf(player) {
        return String(player.minecraftPlayer.getUUID())
    }

    function startPostUse(player) {
        var uuid = uuidOf(player)
        var until = now() + POST_USE_MS
        activeClosures.set(uuid, {
            player: player,
            until: until
        })
        player.persistentData.putLong('sevenworld_chest_post_use_until', until)
        player.tell('§eЭндер-сундук будет недоступен через 10 секунд.')
    }

    ServerEvents.basicCommand('chest', event => {
        var player = event.player
        var uuid = uuidOf(player)
        var data = player.persistentData
        var current = now()

        var closure = activeClosures.get(uuid)
        if (closure && closure.until > current) {
            closure.until = current + POST_USE_MS
            data.putLong('sevenworld_chest_post_use_until', closure.until)
            player.tell('§eЭндер-сундук будет недоступен через 10 секунд.')
            return
        }

        if (closure && closure.until <= current) {
            activeClosures.delete(uuid)
            data.putLong('sevenworld_chest_post_use_until', 0)
            data.putLong('sevenworld_chest_cooldown_until', current + COOLDOWN_MS)
        }

        var cooldownUntil = data.getLong('sevenworld_chest_cooldown_until')
        if (cooldownUntil > current) {
            player.tell('§7Эндер-сундук пока недоступен.')
            return
        }

        // KubeJS exposes the vanilla ender inventory as an InventoryKJS-compatible container.
        player.openInventoryGUI(
            player.minecraftPlayer.getEnderChestInventory(),
            Text.of('Эндер-сундук'),
            9,
            3
        )
        data.putBoolean('sevenworld_chest_opened', true)
    })

    PlayerEvents.inventoryClosed(event => {
        var player = event.player
        var data = player.persistentData

        // Only the /chest flow sets this flag.
        if (!data.getBoolean('sevenworld_chest_opened')) return

        data.putBoolean('sevenworld_chest_opened', false)
        startPostUse(player)
    })

    PlayerEvents.tick(event => {
        var player = event.player
        var data = player.persistentData
        var uuid = uuidOf(player)
        var current = now()

        // Mark the GUI as belonging to /chest after one tick.
        if (data.getBoolean('sevenworld_chest_mark_next_tick')) {
            data.putBoolean('sevenworld_chest_mark_next_tick', false)
            data.putBoolean('sevenworld_chest_opened', true)
        }

        var closure = activeClosures.get(uuid)
        if (closure && closure.until <= current) {
            activeClosures.delete(uuid)
            data.putLong('sevenworld_chest_post_use_until', 0)
            data.putLong('sevenworld_chest_cooldown_until', current + COOLDOWN_MS)
        }
    })
})
