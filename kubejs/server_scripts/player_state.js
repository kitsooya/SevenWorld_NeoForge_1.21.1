// ============================================================
// SevenWorld - Player State Recovery
//
// COMMAND:
//
//   /drive
//     Restore the executing operator.
//
//   /drive <player>
//     Restore selected online player.
//
// Works from:
//   - Operator
//   - Server console
//
// ------------------------------------------------------------
//
// RESTORES PLAYER BODY / STATE:
//
//   Sleep state
//   Gravity
//   Movement velocity
//   Potion effects
//   Health
//   Absorption
//   Hunger
//   Saturation
//   Exhaustion
//   Air
//   Fire
//   Freezing
//   Sprinting
//   Swimming
//   Sneaking
//   Jumping
//   Fall distance
//
// ------------------------------------------------------------
//
// ALSO CLEARS OLD SevenWorld /sleep STATE:
//
//   sevenworld_floor_sleep_pending
//   sevenworld_floor_sleep_active
//   sevenworld_floor_wake_x
//   sevenworld_floor_wake_y
//   sevenworld_floor_wake_z
//   sevenworld_floor_previous_nogravity
//   sevenworld_sleep_mode
//   sevenworld_sleep_was_sleeping
//   sevenworld_day_sleep_pending
//   sevenworld_day_sleep_active
//
// ------------------------------------------------------------
//
// DOES NOT TOUCH:
//
//   Inventory
//   Hotbar
//   Armor
//   Offhand
//   Ender chest
//   XP
//   Level
//   Location
//   Game mode
//   Respawn point
//   Advancements
//
// ============================================================

(function () {

    // ========================================================
    // JAVA CLASSES
    // ========================================================

    var Vec3 =
        Java.loadClass(
            'net.minecraft.world.phys.Vec3'
        )

    var Component =
        Java.loadClass(
            'net.minecraft.network.chat.Component'
        )


    // ========================================================
    // RESET PLAYER STATE
    // ========================================================

    function drivePlayer(player) {

        var data =
            player.persistentData


        // ====================================================
        // SLEEP
        // ====================================================

        if (
            player.isSleeping()
        ) {

            player.stopSleeping()
        }


        // Remove any stale sleeping position.
        player.clearSleepingPos()


        // ====================================================
        // GRAVITY
        // ====================================================

        player.setNoGravity(
            false
        )


        // ====================================================
        // MOVEMENT
        //
        // Use Vec3 object instead of the numeric overload.
        // This avoids the Rhino overload problem that appeared
        // in the previous version.
        // ====================================================

        player.setDeltaMovement(
            new Vec3(
                0.0,
                0.0,
                0.0
            )
        )


        // ====================================================
        // BODY / MOVEMENT FLAGS
        // ====================================================

        player.setSprinting(
            false
        )

        player.setSwimming(
            false
        )

        player.setShiftKeyDown(
            false
        )

        player.setJumping(
            false
        )

        player.fallDistance = 0


        // ====================================================
        // HEALTH
        // ====================================================

        player.setHealth(
            player.getMaxHealth()
        )

        player.setAbsorptionAmount(
            0
        )


        // ====================================================
        // POTION EFFECTS
        // ====================================================

        player.removeAllEffects()


        // ====================================================
        // FOOD
        // ====================================================

        var food =
            player.getFoodData()


        food.setFoodLevel(
            20
        )

        food.setSaturation(
            5.0
        )

        food.setExhaustion(
            0.0
        )


        // ====================================================
        // AIR
        // ====================================================

        player.setAirSupply(
            player.getMaxAirSupply()
        )


        // ====================================================
        // FIRE
        // ====================================================

        player.setRemainingFireTicks(
            0
        )


        // ====================================================
        // FREEZING
        // ====================================================

        player.setTicksFrozen(
            0
        )


        // ====================================================
        // OLD SevenWorld SLEEP DATA
        // ====================================================

        data.remove(
            'sevenworld_floor_sleep_pending'
        )

        data.remove(
            'sevenworld_floor_sleep_active'
        )

        data.remove(
            'sevenworld_floor_wake_x'
        )

        data.remove(
            'sevenworld_floor_wake_y'
        )

        data.remove(
            'sevenworld_floor_wake_z'
        )

        data.remove(
            'sevenworld_floor_previous_nogravity'
        )

        data.remove(
            'sevenworld_sleep_mode'
        )

        data.remove(
            'sevenworld_sleep_was_sleeping'
        )

        data.remove(
            'sevenworld_day_sleep_pending'
        )

        data.remove(
            'sevenworld_day_sleep_active'
        )


        console.info(
            '[SevenWorld State] ' +
            'Player state restored for ' +
            player.username
        )


        return 1
    }


    // ========================================================
    // /drive
    //
    // Operator only.
    //
    // /drive
    // /drive <online player>
    //
    // Console:
    // /drive <online player>
    // ========================================================

    ServerEvents.commandRegistry(
        event => {

            var Commands =
                event.commands

            var Arguments =
                event.arguments


            event.register(

                Commands.literal(
                    'drive'
                )

                // --------------------------------------------
                // Operators only.
                // --------------------------------------------

                .requires(
                    source =>
                        source.hasPermission(2)
                )

                // --------------------------------------------
                // /drive
                //
                // Works for an operator who is a player.
                // --------------------------------------------

                .executes(
                    ctx => {

                        var source =
                            ctx.source

                        var player =
                            source.player


                        // Console must specify a target.
                        if (!player) {

                            source.sendSuccess(
                                () =>
                                    Component.literal(
                                        'Использование: /drive <игрок>'
                                    ),
                                false
                            )

                            return 0
                        }


                        var result =
                            drivePlayer(player)


                        source.sendSuccess(
                            () =>
                                Component.literal(
                                    'Состояние игрока ' +
                                    player.username +
                                    ' восстановлено.'
                                ),
                            true
                        )


                        return result
                    }
                )

                // --------------------------------------------
                // /drive <player>
                //
                // Online player only.
                // --------------------------------------------

                .then(

                    Commands.argument(
                        'target',
                        Arguments.PLAYER.create(event)
                    )

                    .executes(
                        ctx => {

                            var source =
                                ctx.source


                            var player =
                                Arguments.PLAYER.getResult(
                                    ctx,
                                    'target'
                                )


                            var result =
                                drivePlayer(player)


                            source.sendSuccess(
                                () =>
                                    Component.literal(
                                        'Состояние игрока ' +
                                        player.username +
                                        ' восстановлено.'
                                    ),
                                true
                            )


                            // Also notify target.
                            player.tell(
                                '§aСостояние вашего персонажа восстановлено администратором.'
                            )


                            return result
                        }
                    )
                )
            )
        }
    )

})()