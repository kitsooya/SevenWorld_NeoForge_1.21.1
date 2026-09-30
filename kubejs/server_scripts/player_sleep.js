// ============================================================
// SevenWorld - Sleep & Fatigue
//
// ============================================================
// SLEEP MODES
//
// 1. BED / NIGHT
//
//    Normal vanilla sleep.
//    Night is skipped normally.
//
//    After waking:
//      Random recovery phrase.
//
//    Normal next fatigue limit:
//      12-18 in-game days.
//
//    Special chance:
//      "Вы полны сил."
//
//      When triggered:
//        Next fatigue limit is doubled.
//
//        24-36 in-game days.
//
// ------------------------------------------------------------
//
// 2. BED / DAY
//
//    Daytime sleeping is allowed.
//
//    World time does NOT change.
//
//    If the day ends while the player is sleeping,
//    the player is automatically woken before the
//    vanilla night-skip system can use that sleeper.
//
//    After waking:
//      "Дремать тоже полезно."
//
//    Speed I for 5 minutes.
//
// ------------------------------------------------------------
//
// FATIGUE
//
// Counts only ONLINE + AWAKE time.
//
// Normal fatigue limit:
//    12-18 in-game days.
//
// Warnings:
//    ~10 days
//    ~12 days
//    ~14 days
//
// ============================================================

(function () {

    // ========================================================
    // CONFIG
    // ========================================================

    var DAY_TICKS = 24000


    // --------------------------------------------------------
    // Fatigue warnings
    //
    // Old:
    //   5 / 6 / 7 days
    //
    // New:
    //   10 / 12 / 14 days
    // --------------------------------------------------------

    var WARN_5 =
        10 * DAY_TICKS

    var WARN_6 =
        12 * DAY_TICKS

    var WARN_7 =
        14 * DAY_TICKS


    // --------------------------------------------------------
    // Normal fatigue limit:
    // 12-18 days.
    // --------------------------------------------------------

    var MIN_LIMIT_DAYS = 12
    var MAX_LIMIT_DAYS = 18


    // --------------------------------------------------------
    // Special recovery chance.
    //
    // 20% = "Вы полны сил."
    //
    // When triggered:
    // the next fatigue limit becomes 24-36 days.
    // --------------------------------------------------------

    var FULL_OF_ENERGY_CHANCE = 0.20


    // --------------------------------------------------------
    // Speed after bed sleep:
    // 5 minutes.
    // --------------------------------------------------------

    var AFTER_SLEEP_SPEED =
        5 * 60 * 20


    // ========================================================
    // SLEEP MODES
    // ========================================================

    var MODE_NONE = 0

    var MODE_BED_DAY = 1

    var MODE_BED_NIGHT = 2


    // ========================================================
    // RANDOM FATIGUE LIMIT
    // ========================================================

    function randomLimit() {

        var days =
            MIN_LIMIT_DAYS +
            Math.floor(
                Math.random() *
                (
                    MAX_LIMIT_DAYS -
                    MIN_LIMIT_DAYS +
                    1
                )
            )

        return days * DAY_TICKS
    }


    // ========================================================
    // RANDOM NIGHT RECOVERY RESULT
    //
    // Returns:
    //   message
    //   limitMultiplier
    // ========================================================

    function getNightRecoveryResult() {

        // ----------------------------------------------------
        // Special result.
        //
        // "Вы ощущаете необычайную легкость."
        //
        // This result doubles the next fatigue period.
        // ----------------------------------------------------

        if (
            Math.random() <
            FULL_OF_ENERGY_CHANCE
        ) {

            return {
                message: '§aВы ощущаете необычайную легкость.',
                limitMultiplier: 2
            }
        }


        // ----------------------------------------------------
        // Normal recovery messages.
        // ----------------------------------------------------

        var messages = [

            '§aБодрость окутывает вас.',

            '§aУсталости как не видать!',

            '§aВы полны энергией.'
        ]


        var index =
            Math.floor(
                Math.random() *
                messages.length
            )


        return {
            message: messages[index],
            limitMultiplier: 1
        }
    }


    // ========================================================
    // ENSURE FATIGUE LIMIT
    // ========================================================

    function ensureLimit(data) {

        var limit =
            data.getLong(
                'sevenworld_sleep_limit'
            )


        if (limit <= 0) {

            limit =
                randomLimit()

            data.putLong(
                'sevenworld_sleep_limit',
                limit
            )
        }


        return limit
    }


    // ========================================================
    // RESET AFTER ACTUAL SLEEP
    // ========================================================

    function resetSleepCycle(
        player,
        sleepMode
    ) {

        var data =
            player.persistentData


        // ====================================================
        // REMOVE OUR BLINDNESS
        // ====================================================

        if (
            data.getBoolean(
                'sevenworld_sleep_blind_applied'
            )
        ) {

            player.removeEffect(
                'minecraft:blindness'
            )
        }


        // ====================================================
        // RESET FATIGUE TIMER
        // ====================================================

        var newLimit =
            randomLimit()


        // ====================================================
        // NIGHT SLEEP
        //
        // Night sleep gets random recovery result.
        // ====================================================

        if (
            sleepMode ===
            MODE_BED_NIGHT
        ) {

            var recovery =
                getNightRecoveryResult()


            newLimit =
                newLimit *
                recovery.limitMultiplier


            player.tell(
                recovery.message
            )
        }


        // ====================================================
        // DAY SLEEP
        // ====================================================

        else if (
            sleepMode ===
            MODE_BED_DAY
        ) {

            player.tell(
                '§aДремать тоже полезно.'
            )
        }


        // ====================================================
        // WRITE NEW FATIGUE LIMIT
        // ====================================================

        data.putLong(
            'sevenworld_sleep_ticks',
            0
        )

        data.putLong(
            'sevenworld_sleep_limit',
            newLimit
        )


        // ====================================================
        // RESET WARNINGS
        // ====================================================

        data.putBoolean(
            'sevenworld_sleep_warn5',
            false
        )

        data.putBoolean(
            'sevenworld_sleep_warn6',
            false
        )

        data.putBoolean(
            'sevenworld_sleep_warn7',
            false
        )


        // ====================================================
        // RESET BLINDNESS
        // ====================================================

        data.putBoolean(
            'sevenworld_sleep_blind_applied',
            false
        )


        // ====================================================
        // RESET SLEEP FLAGS
        // ====================================================

        data.putBoolean(
            'sevenworld_sleep_was_sleeping',
            false
        )

        data.putBoolean(
            'sevenworld_day_sleep_pending',
            false
        )

        data.putBoolean(
            'sevenworld_day_sleep_active',
            false
        )

        data.putInt(
            'sevenworld_sleep_mode',
            MODE_NONE
        )


        // ====================================================
        // BED SLEEP BONUS
        //
        // Both day and night bed sleep provide Speed I.
        // ====================================================

        player.potionEffects.add(
            'minecraft:speed',
            AFTER_SLEEP_SPEED,
            0
        )
    }


    // ========================================================
    // ALLOW STARTING BED SLEEP DURING DAY
    // ========================================================

    var CanPlayerSleepEvent =
        Java.loadClass(
            'net.neoforged.neoforge.event.entity.player.CanPlayerSleepEvent'
        )


    NativeEvents.onEvent(
        CanPlayerSleepEvent,
        event => {

            var player =
                event.getEntity()


            // Only players.
            if (
                player.type !==
                'minecraft:player'
            ) {
                return
            }


            var problem =
                event.getVanillaProblem()


            if (problem === null) {
                return
            }


            var problemText =
                String(problem)


            // ------------------------------------------------
            // Only override the vanilla daytime restriction.
            // ------------------------------------------------

            if (
                problemText.indexOf(
                    'NOT_POSSIBLE_NOW'
                ) === -1
            ) {
                return
            }


            // Allow daytime bed sleep.
            event.setProblem(null)


            var data =
                player.persistentData


            data.putBoolean(
                'sevenworld_day_sleep_pending',
                true
            )

            data.putBoolean(
                'sevenworld_day_sleep_active',
                false
            )

            data.putInt(
                'sevenworld_sleep_mode',
                MODE_BED_DAY
            )


            console.info(
                '[SevenWorld Sleep] ' +
                'Allowing daytime bed sleep for ' +
                player.username
            )
        }
    )


    // ========================================================
    // ALLOW CONTINUING DAYTIME BED SLEEP
    // ========================================================

    var CanContinueSleepingEvent =
        Java.loadClass(
            'net.neoforged.neoforge.event.entity.player.CanContinueSleepingEvent'
        )


    NativeEvents.onEvent(
        CanContinueSleepingEvent,
        event => {

            var player =
                event.getEntity()


            if (
                player.type !==
                'minecraft:player'
            ) {
                return
            }


            var problem =
                event.getProblem()


            if (problem === null) {
                return
            }


            var problemText =
                String(problem)


            var data =
                player.persistentData


            var daySleep =
                data.getBoolean(
                    'sevenworld_day_sleep_pending'
                ) ||
                data.getBoolean(
                    'sevenworld_day_sleep_active'
                )


            // ------------------------------------------------
            // Only bypass the daytime restriction.
            //
            // Normal bed safety restrictions remain vanilla.
            // ------------------------------------------------

            if (
                daySleep &&
                problemText.indexOf(
                    'NOT_POSSIBLE_NOW'
                ) !== -1
            ) {

                event.setContinueSleeping(
                    true
                )
            }
        }
    )


    // ========================================================
    // MAIN PLAYER TICK
    // ========================================================

    PlayerEvents.tick(
        event => {

            var player =
                event.player

            var data =
                player.persistentData


            var sleeping =
                player.isSleeping()


            var wasSleeping =
                data.getBoolean(
                    'sevenworld_sleep_was_sleeping'
                )


            var sleepMode =
                data.getInt(
                    'sevenworld_sleep_mode'
                )


            // =================================================
            // DAY SLEEP REACHES NIGHT
            //
            // VERY IMPORTANT:
            //
            // A daytime sleeper must not become part of
            // vanilla's night-skip system.
            //
            // As soon as the level stops being daytime,
            // wake the custom day sleeper.
            //
            // We do NOT change the world time.
            // =================================================

            if (
                sleeping &&
                sleepMode === MODE_BED_DAY &&
                !player.level.isDay()
            ) {

                console.info(
                    '[SevenWorld Sleep] ' +
                    player.username +
                    ' DAY SLEEP ENDED WITH SUNSET.'
                )


                player.stopSleeping()


                return
            }


            // =================================================
            // PLAYER IS CURRENTLY SLEEPING
            // =================================================

            if (sleeping) {

                // ------------------------------------------------
                // First actual sleeping tick.
                // ------------------------------------------------

                if (!wasSleeping) {

                    if (
                        sleepMode ===
                        MODE_BED_DAY
                    ) {

                        data.putBoolean(
                            'sevenworld_day_sleep_active',
                            true
                        )

                        data.putBoolean(
                            'sevenworld_day_sleep_pending',
                            false
                        )


                        console.info(
                            '[SevenWorld Sleep] ' +
                            player.username +
                            ' ENTERED DAY BED SLEEP.'
                        )

                    } else {

                        // ------------------------------------------------
                        // Normal night sleep.
                        // ------------------------------------------------

                        sleepMode =
                            MODE_BED_NIGHT


                        data.putInt(
                            'sevenworld_sleep_mode',
                            MODE_BED_NIGHT
                        )


                        console.info(
                            '[SevenWorld Sleep] ' +
                            player.username +
                            ' ENTERED NIGHT BED SLEEP.'
                        )
                    }
                }


                // Sleeping does not count toward fatigue.
                data.putBoolean(
                    'sevenworld_sleep_was_sleeping',
                    true
                )


                return
            }


            // =================================================
            // PLAYER JUST WOKE UP
            // =================================================

            if (wasSleeping) {

                sleepMode =
                    data.getInt(
                        'sevenworld_sleep_mode'
                    )


                console.info(
                    '[SevenWorld Sleep] ' +
                    player.username +
                    ' ACTUALLY WOKE UP. ' +
                    'Mode=' + sleepMode
                )


                resetSleepCycle(
                    player,
                    sleepMode
                )


                return
            }


            // =================================================
            // PLAYER IS AWAKE
            // =================================================

            data.putBoolean(
                'sevenworld_sleep_was_sleeping',
                false
            )


            var ticks =
                data.getLong(
                    'sevenworld_sleep_ticks'
                )


            var limit =
                ensureLimit(data)


            // =================================================
            // COUNT ONLY ONLINE + AWAKE TIME
            // =================================================

            if (
                ticks < limit
            ) {

                ticks++

                data.putLong(
                    'sevenworld_sleep_ticks',
                    ticks
                )
            }


            // =================================================
            // WARNING ~10 DAYS
            // =================================================

            if (
                ticks >= WARN_5 &&
                !data.getBoolean(
                    'sevenworld_sleep_warn5'
                )
            ) {

                data.putBoolean(
                    'sevenworld_sleep_warn5',
                    true
                )

                player.tell(
                    '§7Вы чувствуете усталость...'
                )
            }


            // =================================================
            // WARNING ~12 DAYS
            // =================================================

            if (
                ticks >= WARN_6 &&
                !data.getBoolean(
                    'sevenworld_sleep_warn6'
                )
            ) {

                data.putBoolean(
                    'sevenworld_sleep_warn6',
                    true
                )

                player.tell(
                    '§eВам всё сложнее сохранять бодрость...'
                )
            }


            // =================================================
            // WARNING ~14 DAYS
            // =================================================

            if (
                ticks >= WARN_7 &&
                !data.getBoolean(
                    'sevenworld_sleep_warn7'
                )
            ) {

                data.putBoolean(
                    'sevenworld_sleep_warn7',
                    true
                )

                player.tell(
                    '§6Наступает сонный паралич...'
                )
            }


            // =================================================
            // BLINDNESS LIMIT
            // =================================================

            if (
                ticks >= limit &&
                !data.getBoolean(
                    'sevenworld_sleep_blind_applied'
                )
            ) {

                data.putBoolean(
                    'sevenworld_sleep_blind_applied',
                    true
                )


                // Final warning if not shown yet.
                if (
                    !data.getBoolean(
                        'sevenworld_sleep_warn7'
                    )
                ) {

                    data.putBoolean(
                        'sevenworld_sleep_warn7',
                        true
                    )

                    player.tell(
                        '§6Наступает сонный паралич...'
                    )
                }


                player.potionEffects.add(
                    'minecraft:blindness',
                    40,
                    0
                )
            }


            // =================================================
            // KEEP BLINDNESS ACTIVE
            // =================================================

            if (
                data.getBoolean(
                    'sevenworld_sleep_blind_applied'
                ) &&
                player.tickCount % 20 === 0
            ) {

                player.potionEffects.add(
                    'minecraft:blindness',
                    40,
                    0
                )
            }

        }
    )

})()