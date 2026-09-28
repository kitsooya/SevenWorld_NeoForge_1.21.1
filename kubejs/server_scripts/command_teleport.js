// ============================================================
// SevenWorld TPA
// /tpa <player>     - request lasts 60 seconds
// /tpaccept         - accept
// /tpdeny           - deny
// 5-second teleport delay; movement cancels it.
// 30-second cooldown after successful teleport.
// Cross-dimension teleport is allowed.
// Logout cancels requests.
// ============================================================

(function () {
    var REQUEST_MS = 60 * 1000
    var DELAY_TICKS = 5 * 20
    var COOLDOWN_MS = 30 * 1000

    var outgoing = new Map()
    var incoming = new Map()
    var teleporting = new Map()

    function now() {
        return Date.now()
    }

    function uuidOf(player) {
        return String(player.minecraftPlayer.getUUID())
    }

    function cancelRequest(request, message) {
        outgoing.delete(request.requesterUuid)
        incoming.delete(request.targetUuid)
        teleporting.delete(request.requesterUuid)

        if (message) {
            if (request.requester) request.requester.tell(message)
            if (request.target) request.target.tell(message)
        }
    }

    function currentPosition(player) {
        return {
            x: player.x,
            y: player.y,
            z: player.z,
            dimension: String(player.minecraftPlayer.level().dimension().location())
        }
    }

    ServerEvents.commandRegistry(event => {
        var Commands = event.commands
        var Arguments = event.arguments

        event.register(
            Commands.literal('tpa')
                .requires(source => source.hasPermission(0))
                .then(
                    Commands.argument('target', Arguments.PLAYER.create(event))
                        .executes(ctx => {
                            var requester = ctx.source.player
                            var target = Arguments.PLAYER.getResult(ctx, 'target')
                            var requesterUuid = uuidOf(requester)
                            var targetUuid = uuidOf(target)
                            var current = now()

                            if (requesterUuid === targetUuid) {
                                requester.tell('§cНельзя отправить запрос самому себе.')
                                return 0
                            }

                            if (outgoing.has(requesterUuid) || incoming.has(requesterUuid)) {
                                requester.tell('§cУ вас уже есть активный запрос телепортации.')
                                return 0
                            }

                            if (incoming.has(targetUuid)) {
                                requester.tell('§cУ этого игрока уже есть активный запрос телепортации.')
                                return 0
                            }

                            var cooldownUntil = requester.persistentData.getLong('sevenworld_tpa_cooldown_until')
                            if (cooldownUntil > current) {
                                requester.tell('§cТелепортация пока недоступна.')
                                return 0
                            }

                            var request = {
                                requester: requester,
                                target: target,
                                requesterUuid: requesterUuid,
                                targetUuid: targetUuid,
                                expiresAt: current + REQUEST_MS
                            }

                            outgoing.set(requesterUuid, request)
                            incoming.set(targetUuid, request)

                            requester.tell('§aЗапрос на телепортацию отправлен игроку ' + target.username + '.')
                            target.tell('§e' + requester.username + ' хочет телепортироваться к вам.')
                            target.tell('§7Используйте /tpaccept или /tpdeny.')
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
                        target.tell('§7У вас нет активных запросов TPA.')
                        return 0
                    }

                    var requester = request.requester
                    if (!requester || !requester.isAlive()) {
                        cancelRequest(request, '§cЗапрос TPA больше недействителен.')
                        return 0
                    }

                    var cooldownUntil = requester.persistentData.getLong('sevenworld_tpa_cooldown_until')
                    if (cooldownUntil > now()) {
                        cancelRequest(request, '§cУ отправителя ещё действует перезарядка телепортации.')
                        return 0
                    }

                    outgoing.delete(request.requesterUuid)
                    incoming.delete(request.targetUuid)

                    var start = currentPosition(requester)
                    teleporting.set(request.requesterUuid, {
                        requester: requester,
                        target: target,
                        requesterUuid: request.requesterUuid,
                        remaining: DELAY_TICKS,
                        start: start
                    })

                    requester.tell('§eТелепортация начнётся через 5 секунд. Не двигайтесь.')
                    target.tell('§aЗапрос TPA принят.')
                    return 1
                })
        )

        event.register(
            Commands.literal('tpdeny')
                .requires(source => source.hasPermission(0))
                .executes(ctx => {
                    var target = ctx.source.player
                    var request = incoming.get(uuidOf(target))

                    if (!request) {
                        target.tell('§7У вас нет активных запросов TPA.')
                        return 0
                    }

                    cancelRequest(request, '§cЗапрос на телепортацию отклонён.')
                    return 1
                })
        )
    })

    ServerEvents.tick(event => {
        var current = now()

        outgoing.forEach((request, key) => {
            if (request.expiresAt <= current) {
                cancelRequest(request, '§7Запрос на телепортацию истёк.')
            }
        })

        teleporting.forEach((tp, key) => {
            var player = tp.requester

            if (!player || !player.isAlive()) {
                cancelRequest(tp, '§cТелепортация отменена.')
                return
            }

            var movedDimension = String(player.minecraftPlayer.level().dimension().location()) !== tp.start.dimension
            var moved = player.x !== tp.start.x || player.y !== tp.start.y || player.z !== tp.start.z

            if (movedDimension || moved) {
                cancelRequest(tp, '§cТелепортация отменена: вы двинулись.')
                return
            }

            tp.remaining--
            if (tp.remaining > 0) return

            var dimension = String(tp.target.minecraftPlayer.level().dimension().location())
            var x = tp.target.x
            var y = tp.target.y
            var z = tp.target.z

            event.server.runCommandSilent(
                'execute in ' + dimension + ' run tp ' + player.username + ' ' + x + ' ' + y + ' ' + z
            )

            player.persistentData.putLong('sevenworld_tpa_cooldown_until', current + COOLDOWN_MS)
            teleporting.delete(key)

            player.tell('§aТелепортация выполнена.')
            tp.target.tell('§aИгрок ' + player.username + ' телепортирован к вам.')
        })
    })

    PlayerEvents.loggedOut(event => {
        var player = event.player
        var uuid = uuidOf(player)

        var request = outgoing.get(uuid)
        if (request) cancelRequest(request, '§7Запрос TPA отменён: игрок вышел с сервера.')

        request = incoming.get(uuid)
        if (request) cancelRequest(request, '§7Запрос TPA отменён: игрок вышел с сервера.')

        var tp = teleporting.get(uuid)
        if (tp) cancelRequest(tp, '§7Телепортация отменена: игрок вышел с сервера.')
    })
})()
