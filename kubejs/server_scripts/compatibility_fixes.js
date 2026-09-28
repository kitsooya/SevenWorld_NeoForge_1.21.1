ServerEvents.tags('irons_jewelry:material', event => {
    event.get('irons_spellbooks:rune').remove('hazennstuff:hydro_rune')
})

ServerEvents.tags('irons_spellbooks:spells', event => {
    event.get('magic_realms:jara_spells').remove('irons_spellbooks:charged')
})

// ============================================================
// Fix broken/missing tag references
// ============================================================

// Aero Additions
ServerEvents.tags('damage_type', event => {
    event.removeAll('minecraft:entity_type/deflects_projectiles')
})

// Valiant
ServerEvents.tags('entity_type', event => {
    event.remove(
        'minecraft:undead',
        'valiant:spectralzombie'
    )
})

// Reliquified Iron's Spells & Spellbooks
ServerEvents.tags('item', event => {
    event.remove(
        'relics:relics',
        'reliquified_irons_spells_and_spellbooks:bloodied_voodoo_doll'
    )
})

// Darker Magic
ServerEvents.tags('item', event => {
    event.remove(
        'minecraft:enchantable/equippable',
        'darkermagic:whispers_staff'
    )
})

// Asterism Arcanum
ServerEvents.tags('item', event => {
    event.remove(
        'asterismarcanum:damage_type/astral_magic',
        'asterismarcanum:astral_magic'
    )
})

// Magic From The East
ServerEvents.tags('item', event => {
    event.remove(
        'c:raw_materials/jade',
        'iss_magicfromtheeast:raw_jade'
    )
})

// touhou_little_maid_spell
ServerEvents.tags('worldgen/structure', event => {
    event.removeAll('touhou_little_maid_spell:fairy_maid_cafe')
    event.removeAll('touhou_little_maid_spell:yin_yang_altar')
})

