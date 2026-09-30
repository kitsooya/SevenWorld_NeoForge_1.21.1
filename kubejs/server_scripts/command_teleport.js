// ============================================================
// SevenWorld TPA
// /tpa <player>     - request lasts 60 seconds
// /tpaccept         - accept
// /tpdeny           - deny
//
// 5-second teleport delay; movement cancels it.
// 30-second cooldown after successful teleport.
// Cross-dimension teleport is allowed.
// Logout cancels requests.
// ============================================================

(function () {
    var REQUEST_MS = 60 * 1000
    var DELAY_TICKS = 5 * 20
    var COOLDOWN_MS = 30 * 1000

    // Радиус, в котором игрок считается успешно телепортированным.
    var TELEPORT_RADIUS = 1.0

    // Сколько тиков даём серверу на применение телепорта.
    var VERIFY_TICKS = 5

    var outgoing = new Map()
    var incoming = new Map()
    var teleporting = new Map()

    function now() {
        return Date.now()
    }

    function uuidOf(player) {
        return String(player.getUuid())
    }

    function dimensionOf(player) {
        return String(player.level.dimension)
    }

    function cancelRequest(request, message) {
        outgoing.delete(request.requesterUuid)
        incoming.delete(request.targetUuid)
        teleporting.delete(request.requesterUuid)

        if (message) {
            if (request.requester) {
                request.requester.tell(message)
            }

            if (request.target) {
                request.target.tell(message)
            }
        }
    }

    function currentPosition(player) {
        return {
            x: Number(player.x),
            y: Number(player.y),
            z: Number(player.z),
            dimension: dimensionOf(player)
        }
    }

    // ============================================================
    // Проверка фактической телепортации по радиусу.
    //
    // Игрок считается успешно телепортированным, если находится
    // не дальше TELEPORT_RADIUS блоков от точки назначения.
    // ============================================================

    function positionsMatch(player, destination) {
        if (dimensionOf(player) !== destination.dimension) {
            return false
        }

        var dx =
            Number(player.x) - destination.x

        var dy =
            Number(player.y) - destination.y

        var dz =
            Number(player.z) - destination.z

        var distanceSquared =
            dx * dx +
            dy * dy +
            dz * dz

        return distanceSquared <=
            TELEPORT_RADIUS * TELEPORT_RADIUS
    }

    // ============================================================
    // Teleport through vanilla command.
    //
    // The return value of runCommandSilent() is NOT used as the
    // success check. Actual success is verified over several ticks.
    // ============================================================

    function teleportPlayer(player, target) {
        var dimension = dimensionOf(target)

        var x = Number(target.x)
        var y = Number(target.y)
        var z = Number(target.z)
        var yaw = Number(target.yRot)
        var pitch = Number(target.xRot)

        var playerName = String(player.username)

        var command =
            'execute as ' +
            playerName +
            ' in ' +
            dimension +
            ' run tp @s ' +
            x +
            ' ' +
            y +
            ' ' +
            z +
            ' ' +
            yaw +
            ' ' +
            pitch

        player.server.runCommandSilent(command)

        return {
            dimension: dimension,
            x: x,
            y: y,
            z: z
        }
    }

    ServerEvents.commandRegistry(event => {
        var Commands = event.commands
        var Arguments = event.arguments

        event.register(
            Commands.literal('tpa')
                .requires(source => source.hasPermission(0))
                .then(
                    Commands.argument(
                        'target',
                        Arguments.PLAYER.create(event)
                    )
                    .executes(ctx => {
                        var requester = ctx.source.player
                        var target = Arguments.PLAYER.getResult(
                            ctx,
                            'target'
                        )

                        var requesterUuid = uuidOf(requester)
                        var targetUuid = uuidOf(target)
                        var current = now()

                        if (requesterUuid === targetUuid) {
                            requester.tell(
                                '§cНельзя отправить запрос самому себе.'
                            )
                            return 0
                        }

                        if (
                            outgoing.has(requesterUuid) ||
                            incoming.has(requesterUuid)
                        ) {
                            requester.tell(
                                '§cУ вас уже есть активный запрос телепортации.'
                            )
                            return 0
                        }

                        if (incoming.has(targetUuid)) {
                            requester.tell(
                                '§cУ этого игрока уже есть активный запрос телепортации.'
                            )
                            return 0
                        }

                        var cooldownUntil =
                            requester.persistentData.getLong(
                                'sevenworld_tpa_cooldown_until'
                            )

                        if (cooldownUntil > current) {
                            var remaining =
                                Math.ceil(
                                    (cooldownUntil - current) / 1000
                                )

                            requester.tell(
                                '§cТелепортация пока недоступна. ' +
                                'Подождите ' +
                                remaining +
                                ' сек.'
                            )
                            return 0
                        }

                        var request = {
                            requester: requester,
                            target: target,
                            requesterUuid: requesterUuid,
                            targetUuid: targetUuid,
                            expiresAt: current + REQUEST_MS
                        }

                        outgoing.set(
                            requesterUuid,
                            request
                        )

                        incoming.set(
                            targetUuid,
                            request
                        )

                        requester.tell(
                            '§aЗапрос на телепортацию отправлен игроку ' +
                            target.username +
                            '.'
                        )

                        target.tell(
                            '§e' +
                            requester.username +
                            ' хочет телепортироваться к вам.'
                        )

                        target.tell(
                            '§7Используйте /tpaccept или /tpdeny.'
                        )

                        return 1
                    })
                )
        )

        event.register(
            Commands.literal('tpaccept')
                .requires(source => source.hasPermission(0))
                .executes(ctx => {
                    var target = ctx.source.player
                    var targetUuid = uuidOf(target)

                    var request = incoming.get(targetUuid)

                    if (!request) {
                        target.tell(
                            '§7У вас нет активных запросов TPA.'
                        )
                        return 0
                    }

                    var requester = request.requester

                    if (!requester || !requester.isAlive()) {
                        cancelRequest(
                            request,
                            '§cЗапрос TPA больше недействителен.'
                        )
                        return 0
                    }

                    var cooldownUntil =
                        requester.persistentData.getLong(
                            'sevenworld_tpa_cooldown_until'
                        )

                    if (cooldownUntil > now()) {
                        cancelRequest(
                            request,
                            '§cУ отправителя ещё действует перезарядка телепортации.'
                        )
                        return 0
                    }

                    outgoing.delete(
                        request.requesterUuid
                    )

                    incoming.delete(
                        request.targetUuid
                    )

                    var start = currentPosition(
                        requester
                    )

                    teleporting.set(
                        request.requesterUuid,
                        {
                            requester: requester,
                            target: target,
                            requesterUuid: request.requesterUuid,
                            targetUuid: request.targetUuid,
                            remaining: DELAY_TICKS,
                            start: start,
                            verifying: false,
                            destination: null,
                            verifyTicksRemaining: 0
                        }
                    )

                    requester.tell(
                        '§eТелепортация начнётся через 5 секунд. Не двигайтесь.'
                    )

                    target.tell(
                        '§aЗапрос TPA принят.'
                    )

                    return 1
                })
        )

        event.register(
            Commands.literal('tpdeny')
                .requires(source => source.hasPermission(0))
                .executes(ctx => {
                    var target = ctx.source.player

                    var request = incoming.get(
                        uuidOf(target)
                    )

                    if (!request) {
                        target.tell(
                            '§7У вас нет активных запросов TPA.'
                        )
                        return 0
                    }

                    cancelRequest(
                        request,
                        '§cЗапрос на телепортацию отклонён.'
                    )

                    return 1
                })
        )
    })

    ServerEvents.tick(event => {
        var current = now()

        outgoing.forEach((request, key) => {
            if (request.expiresAt <= current) {
                cancelRequest(
                    request,
                    '§7Запрос на телепортацию истёк.'
                )
            }
        })

        teleporting.forEach((tp, key) => {
            var player = tp.requester
            var target = tp.target

            if (!player || !player.isAlive()) {
                cancelRequest(
                    tp,
                    '§cТелепортация отменена.'
                )
                return
            }

            if (!target || !target.isAlive()) {
                cancelRequest(
                    tp,
                    '§cТелепортация отменена: цель больше недоступна.'
                )
                return
            }

            // ====================================================
            // Проверка результата телепорта.
            //
            // Движение после телепорта не отменяет его.
            // Проверяем несколько тиков подряд.
            // ====================================================

            if (tp.verifying) {
                if (
                    tp.destination &&
                    positionsMatch(
                        player,
                        tp.destination
                    )
                ) {
                    teleporting.delete(key)

                    player.persistentData.putLong(
                        'sevenworld_tpa_cooldown_until',
                        current + COOLDOWN_MS
                    )

                    player.tell(
                        '§aТелепортация выполнена.'
                    )

                    target.tell(
                        '§aИгрок ' +
                        player.username +
                        ' телепортирован к вам.'
                    )

                    return
                }

                tp.verifyTicksRemaining--

                if (tp.verifyTicksRemaining > 0) {
                    return
                }

                cancelRequest(
                    tp,
                    '§cТелепортация не удалась: сервер не подтвердил перемещение.'
                )

                return
            }

            // ====================================================
            // Проверяем движение ДО телепорта.
            // ====================================================

            var movedDimension =
                dimensionOf(player) !== tp.start.dimension

            var moved =
                Number(player.x) !== tp.start.x ||
                Number(player.y) !== tp.start.y ||
                Number(player.z) !== tp.start.z

            if (movedDimension || moved) {
                cancelRequest(
                    tp,
                    '§cТелепортация отменена: вы двинулись.'
                )
                return
            }

            tp.remaining--

            if (tp.remaining > 0) {
                return
            }

            // ====================================================
            // Выполняем телепортацию.
            // ====================================================

            try {
                tp.destination = teleportPlayer(
                    player,
                    target
                )

                tp.verifying = true
                tp.verifyTicksRemaining = VERIFY_TICKS
            } catch (error) {
                console.error(
                    '[SevenWorld TPA] Teleport error: ' +
                    error
                )

                cancelRequest(
                    tp,
                    '§cТелепортация не удалась.'
                )
            }
        })
    })

    PlayerEvents.loggedOut(event => {
        var player = event.player
        var uuid = uuidOf(player)

        var request = outgoing.get(uuid)

        if (request) {
            cancelRequest(
                request,
                '§7Запрос TPA отменён: игрок вышел с сервера.'
            )
        }

        request = incoming.get(uuid)

        if (request) {
            cancelRequest(
                request,
                '§7Запрос TPA отменён: игрок вышел с сервера.'
            )
        }

        var tp = teleporting.get(uuid)

        if (tp) {
            cancelRequest(
                tp,
                '§7Телепортация отменена: игрок вышел с сервера.'
            )
        }
    })
})()
