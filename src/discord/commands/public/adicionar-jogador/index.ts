import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import AdicionarJogadorService from "./adicionar-jogador.service.js";
import AutocompleteMemberTeam from "#services/autocomplete-team-sair.service.js";
import { InteractionMethods } from "#services/interaction-methods.service.js";

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
    return await AutocompleteMemberTeam({ interaction });
  },
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await methods.deferReply();
    await AdicionarJogadorService(methods);
  },
});
