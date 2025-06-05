import { createCommand } from "#base";
import AutocompleteMemberTeam from "#services/autocomplete-team-sair.service.js";
import RemoverJogadorTimeService from "#services/remover-jogador-time.service.js";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionFlagsBits,
} from "discord.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";

createCommand({
  name: "remover-jogador",
  description: "Remove um jogador de um time (Apenas Administradores).",
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: [PermissionFlagsBits.Administrator], // Restrict to Admins
  options: [
    {
      name: "time",
      description: "O nome do time do qual o jogador será removido.",
      type: ApplicationCommandOptionType.String,
      required,
      autocomplete,
    },
    {
      name: "jogador",
      description: "O jogador a ser removido do time.",
      type: ApplicationCommandOptionType.User,
      required,
    },
  ],
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === "time") {
      return await AutocompleteMemberTeam({ interaction, listAll: true });
    }
    return [];
  },
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    const player = methods.getMember("jogador");
    if (player) await RemoverJogadorTimeService({ methods, player });
  },
});
