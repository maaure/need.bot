import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import AdicionarJogadorService from "./adicionar-jogador.service.js";

createCommand({
  name: "adcionar-jogador",
  description: "Adicione um jogador a algum time",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "time",
      description: "O time que você quer adicionar o jogador.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "jogador",
      description: "Marque o jogador que você quer adicionar ao seu time.",
      type: ApplicationCommandOptionType.User,
    },
  ],
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await methods.deferReply();
    await AdicionarJogadorService(methods);
  },
});
