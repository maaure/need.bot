import getColors from "#utils/getColors.js";
import { AutocompleteInteraction } from "discord.js";

interface AutocompleteColorParams {
  interaction: AutocompleteInteraction<"cached">;
}

export default async function AutocompleteColor({
  interaction,
}: AutocompleteColorParams) {
  const focusedValue = interaction.options.getFocused().trim().toLowerCase();
  return getColors(focusedValue);
}
