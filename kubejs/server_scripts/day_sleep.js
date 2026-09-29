
// ============================================================
// SevenWorld - Day Sleep
//
// Allows players to sleep in beds at ANY time.
//
// DAY:
//   Player can sleep.
//   World time does NOT skip.
//   Player simply enters the sleeping state.
//
// NIGHT:
//   Vanilla Minecraft sleeping behaviour remains unchanged.
//   Night can still be skipped normally.
//
// No time manipulation is performed by this script.
// ============================================================

(function () {

    var CanPlayerSleepEvent = Java.loadClass(
        'net.neoforged.neoforge.event.entity.player.CanPlayerSleepEvent'
    )


    NativeEvents.onEvent(
        CanPlayerSleepEvent,
        event => {

            var player = event.getEntity()


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
            // Get world time
            //
            // Minecraft day cycle:
            //
            // 0     = sunrise
            // 6000  = noon
            // 12000 = sunset
            // 18000 = midnight
            // 24000 = next sunrise
            //
            // Day is approximately:
            // 0 -> 12000
            // ----------------------------------------------------

            var time =
                player.level.dayTime % 24000


            // ----------------------------------------------------
            // During daytime:
            //
            // Vanilla normally rejects the sleep attempt with
            // "You can sleep only at night or during thunderstorms."
            //
            // Setting the problem to null tells NeoForge that
            // the player is allowed to sleep.
            // ----------------------------------------------------

            if (
                time >= 0 &&
                time < 12000
            ) {

                event.setProblem(null)
            }

            // ----------------------------------------------------
            // During night:
            //
            // Do absolutely nothing.
            //
            // Vanilla result remains untouched.
            // ----------------------------------------------------

        }
    )

})()

