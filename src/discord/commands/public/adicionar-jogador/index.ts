import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionsBitField,
} from "discord.js";
import { InteractionMethodsType } from "discord/services/interaction-methods.service.js";
import AdicionarJogadorService from "./adicionar-jogador.service.js";
import { prisma } from "#database";
import { logger } from "#settings";
import AutocompleteTeamService from "./autocomplete-time.service.js";

createCommand({
  name: "adicionar-jogador",
  description: "Adicione um jogador a algum time",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "time",
      description: "O time que você quer adicionar o jogador.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "jogador",
      description: "Marque o jogador que você quer adicionar ao seu time.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  async autocomplete(interaction) {
    return await AutocompleteTeamService(interaction);
  },
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await methods.deferReply();
    await AdicionarJogadorService(methods);
  },
});
