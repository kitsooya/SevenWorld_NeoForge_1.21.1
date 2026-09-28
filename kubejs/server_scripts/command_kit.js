ServerEvents.commandRegistry(event => {
    const { commands } = event

    event.register(
        commands.literal('kit')
            .requires(source => source.hasPermission(0))
            .executes(ctx => {
                const player = ctx.source.player

                player.give(Item.of('minecraft:cooked_beef', 3))
                player.give(Item.of('minecraft:iron_sword', 1))
                player.give(Item.of('minecraft:iron_pickaxe', 1))

                player.tell('§aТы получил стартовый набор!')
                return 1
            })
    )
})
