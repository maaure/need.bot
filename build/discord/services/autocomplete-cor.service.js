import getColors from "../../utils/getColors.js";
export default async function AutocompleteColor({ interaction, }) {
    const focusedValue = interaction.options.getFocused().trim().toLowerCase();
    return getColors(focusedValue);
}
