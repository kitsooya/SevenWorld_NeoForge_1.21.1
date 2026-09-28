// ============================================================
// SevenWorld drink classification
// Most modded drinks are detected automatically by the DRINK
// use animation. This tag is for items that should count as a
// drink even when they use another animation.
// ============================================================

ServerEvents.tags('item', event => {
    event.add('sevenworld:drinkable', [
        'minecraft:milk_bucket',
        'minecraft:honey_bottle'
    ])
})
