package com.kitsooya.hazennstuffpatch.mixin;

import net.hazen.hazennstuff.Item.Curios.Misc.PendantOfHarmonyCurio;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Overwrite;

@Mixin(PendantOfHarmonyCurio.class)
public class PendantOfHarmonyCurioMixin {

    @Overwrite
    public Component getName(ItemStack stack) {
        return stack.getHoverName();
    }
}