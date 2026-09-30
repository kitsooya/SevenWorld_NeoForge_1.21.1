package com.sevenworld.slashbladepatch.mixin;

import mods.flammpfeil.slashblade.data.tag.SlashBladeEntityTypeTagProvider.EntityTypeTags;
import mods.flammpfeil.slashblade.util.TargetSelector;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

import java.util.Set;

/**
 * Makes only the explicitly listed Ice and Fire entities valid SlashBlade targets.
 *
 * This runs before SlashBlade's normal Enemy check, so FRIENDLY_ENABLE can remain
 * disabled and ordinary friendly mobs (including maids) remain protected.
 */
@Mixin(TargetSelector.AttackablePredicate.class)
public abstract class AttackablePredicateMixin {
    private static final Set<String> ALLOWED_ICE_AND_FIRE = Set.of(
            "fire_dragon",
            "ice_dragon",
            "lightning_dragon",
            "hippogryph",
            "pixie",
            "cyclops",
            "siren",
            "gorgon",
            "deathworm",
            "cockatrice",
            "stymphalian_bird",
            "troll",
            "amphithere",
            "sea_serpent",
            "dread_lich",
            "hydra",
            "hippocampus",
            "ghost"
    );

    @Inject(method = "test", at = @At("HEAD"), cancellable = true)
    private void sevenworld$allowConfiguredIceAndFireTarget(
            LivingEntity livingEntity,
            CallbackInfoReturnable<Boolean> cir
    ) {
        ResourceLocation id = BuiltInRegistries.ENTITY_TYPE.getKey(livingEntity.getType());
        if (id == null || !"iceandfire".equals(id.getNamespace())) {
            return;
        }

        if (!ALLOWED_ICE_AND_FIRE.contains(id.getPath())) {
            return;
        }

        // Preserve two of SlashBlade's safety filters for the whitelisted entities.
        if (livingEntity.hasPassenger(entity -> entity instanceof Player)) {
            cir.setReturnValue(false);
            return;
        }

        if (livingEntity.getType().is(EntityTypeTags.ATTACKABLE_BLACKLIST)) {
            cir.setReturnValue(false);
            return;
        }

        cir.setReturnValue(true);
    }
}
