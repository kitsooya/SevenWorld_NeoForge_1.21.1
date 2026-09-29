// ============================================================
// SevenWorld basic utility commands
// /git  - GitHub link, 1 minute cooldown, silent during cooldown
// /eat  - 1 random vanilla cooked meat, once every 5 hours
// /heal - full health, once every 10 hours, hunger unchanged
// ============================================================

(function () {
    var GITHUB_URL = 'https://github.com/kitsooya/SevenWorld_NeoForge_1.21.1'

    var EAT_COOLDOWN_MS = 5 * 60 * 60 * 1000
    var HEAL_COOLDOWN_MS = 10 * 60 * 60 * 1000
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

    // --------------------------------------------------------
    // /git
    // GitHub link, once every 60 seconds.
    // Silent while on cooldown.
    // --------------------------------------------------------

    ServerEvents.basicCommand('git', event => {
        var player = event.player
        var data = player.persistentData
        var current = now(
