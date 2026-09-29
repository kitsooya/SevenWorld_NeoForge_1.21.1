// ============================================================
// SevenWorld - hydration
// Counts ONLY ONLINE time.
//
// Slowness threshold: random 4-6 in-game days (whole days).
// At ~4 days: "Вы чувствуете жажду."
// At the actual threshold: "В горле пересохло..."
//
// Finishing a drink resets hydration, removes ALL Slowness
// and gives Speed I for 30 seconds.
//
// "Вы чувствуете себя лучше." appears only after the player
// has already reached the thirst-warning stage.
//
// Drink detection uses NeoForge's Finish event, so a drink is
// counted only after the item has actually been fully consumed.
//
// A custom #sevenworld:drinkable tag is also supported.
//
// IMPORTANT:
// The hydration timer is processed through ServerEvents.tick
// and only for players currently present in server.players.
// Therefore logout completely stops the timer.
// ============================================================

(function () {

    var DAY_TICKS = 24000
    var WARNING_TICKS = 4 * DAY_TICKS

    var MIN_LIMIT_DAYS = 4
    var MAX_LIMIT_DAYS = 6

    var SPEED_TICKS = 30 * 20


    // ============================================================
    // Minecraft classes
    // ============================================================

    var UseAnim = Java.loadClass(
        'net.minecraft.world.item.UseAnim'
    )

    var FinishEvent = Java.loadClass(
        'net.neoforged.neoforge.event.entity.living.LivingEntityUseItemEvent$Finish'
    )


    // ============================================================
    // Generate random hydration limit
    //
    // Possible values:
    // 4 days
    // 5 days
    // 6 days
    // ============================================================

    function randomLimit() {

        var days =
            MIN_LIMIT_DAYS +
            Math.floor(
                Math.random() *
                (MAX_LIMIT_DAYS - MIN_LIMIT_DAYS + 1)
            )

        return days * DAY_TICKS
    }


    // ============================================================
    // Make sure the player has a hydration limit
    // ============================================================

    function ensureLimit(data) {

        var limit =
            data.getLong(
                'sevenworld_hydration_limit'
            )

        if (limit <= 0) {

            limit = randomLimit()

            data.putLong(
                'sevenworld_hydration_limit',
                limit
            )
        }

        return limit
    }


    // ============================================================
    // Check whether an item is a drink
    // ============================================================

    function isDrink(stack) {

        if (!stack || stack.isEmpty()) {
            return false
        }


        // --------------------------------------------------------
        // SevenWorld custom drinkable tag
        // --------------------------------------------------------

        try {

            if (
                Ingredient
                    .of('#sevenworld:drinkable')
                    .test(stack)
            ) {
                return true
            }

        } catch (e) {

            // Tag lookup failure should not prevent
            // normal drink detection.
        }


        // --------------------------------------------------------
        // Vanilla / modded drink animation
        // --------------------------------------------------------

        try {

            return (
                stack
                    .getItem()
                    .getUseAnimation(stack)
                === UseAnim.DRINK
            )

        } catch (e) {

            return false
        }
    }


    // ============================================================
    // Reset hydration after drinking
    // ============================================================

    function resetHydration(player, lateStage) {

        var data =
            player.persistentData


        // --------------------------------------------------------
        // Reset hydration timer
        // --------------------------------------------------------

        data.putLong(
            'sevenworld_hydration_ticks',
            0
        )


        // --------------------------------------------------------
        // Generate a new random thirst threshold
        // --------------------------------------------------------

        data.putLong(
            'sevenworld_hydration_limit',
            randomLimit()
        )


        // --------------------------------------------------------
        // Allow the 4-day warning to happen again
        // --------------------------------------------------------

        data.putBoolean(
            'sevenworld_hydration_warning4',
            false
        )


        // --------------------------------------------------------
        // Remove ALL Slowness
        //
        // This intentionally removes Slowness regardless of
        // where it came from.
        // --------------------------------------------------------

        player.removeEffect(
            'minecraft:slowness'
        )


        // --------------------------------------------------------
        // Hydration fatigue is no longer active
        // --------------------------------------------------------

        data.putBoolean(
            'sevenworld_hydration_slow_applied',
            false
        )


        // --------------------------------------------------------
        // Recovery message
        //
        // Only shown if the player had already reached
        // the thirst-warning stage.
        // --------------------------------------------------------

        if (lateStage) {

            player.tell(
                '§aВы чувствуете себя лучше.'
            )
        }


        // --------------------------------------------------------
        // Speed I for 30 seconds
        // --------------------------------------------------------

        player.potionEffects.add(
            'minecraft:speed',
            SPEED_TICKS,
            0
        )
    }


    // ============================================================
    // DRINK FINISH EVENT
    //
    // Triggered only after the item has actually been consumed.
    // ============================================================

    NativeEvents.onEvent(
        FinishEvent,
        event => {

            var player =
                event.getEntity()

            var stack =
                event.getItem()


            // ----------------------------------------------------
            // Only players
            // ----------------------------------------------------

            if (
                player.type !==
                'minecraft:player'
            ) {
                return
            }


            // ----------------------------------------------------
            // Only drinks
            // ----------------------------------------------------

            if (!isDrink(stack)) {
                return
            }


            var data =
                player.persistentData


            // ----------------------------------------------------
            // Check whether player had reached the warning stage
            // ----------------------------------------------------

            var lateStage =
                data.getLong(
                    'sevenworld_hydration_ticks'
                ) >= WARNING_TICKS


            // ----------------------------------------------------
            // Reset everything
            // ----------------------------------------------------

            resetHydration(
                player,
                lateStage
            )
        }
    )


    // ============================================================
    // ONLINE HYDRATION TIMER
    //
    // IMPORTANT:
    //
    // We intentionally do NOT use PlayerEvents.tick.
    //
    // ServerEvents.tick runs once per server tick.
    // server.players contains only currently connected players.
    //
    // Therefore:
    //
    // PLAYER ONLINE:
    //     timer increases
    //
    // PLAYER OFFLINE:
    //     player is not in server.players
    //     timer does NOT increase
    //
    // PLAYER LOGS BACK IN:
    //     timer continues from saved persistentData
    // ============================================================

    ServerEvents.tick(event => {

        var server =
            event.server


        // --------------------------------------------------------
        // Process ONLY currently online players
        // --------------------------------------------------------

        server.players.forEach(player => {

            var data =
                player.persistentData


            var ticks =
                data.getLong(
                    'sevenworld_hydration_ticks'
                )


            var limit =
                ensureLimit(data)


            // ----------------------------------------------------
            // Hydration timer
            // ----------------------------------------------------

            if (ticks < limit) {

                ticks++

                data.putLong(
                    'sevenworld_hydration_ticks',
                    ticks
                )
            }


            // ----------------------------------------------------
            // ~4-day thirst warning
            // ----------------------------------------------------

            if (
                ticks >= WARNING_TICKS &&
                !data.getBoolean(
                    'sevenworld_hydration_warning4'
                )
            ) {

                data.putBoolean(
                    'sevenworld_hydration_warning4',
                    true
                )


                player.tell(
                    '§eВы чувствуете жажду.'
                )
            }


            // ----------------------------------------------------
            // Actual thirst threshold
            // ----------------------------------------------------

            if (
                ticks >= limit &&
                !data.getBoolean(
                    'sevenworld_hydration_slow_applied'
                )
            ) {

                data.putBoolean(
                    'sevenworld_hydration_slow_applied',
                    true
                )


                // Apply Slowness
                player.potionEffects.add(
                    'minecraft:slowness',
                    40,
                    0
                )


                player.tell(
                    '§6В горле пересохло...'
                )
            }


            // ----------------------------------------------------
            // Keep hydration Slowness active
            //
            // The effect lasts 40 ticks (2 seconds) and is
            // refreshed once every second.
            // ----------------------------------------------------

            if (
                data.getBoolean(
                    'sevenworld_hydration_slow_applied'
                ) &&
                player.tickCount % 20 === 0
            ) {

                player.potionEffects.add(
                    'minecraft:slowness',
                    40,
                    0
                )
            }

        })
    })

})()

