import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import DefinirCapitaoService from "./definir-capitao.service.js";
import AutocompleteTeamService from "../adicionar-jogador/autocomplete-time.service.js";

createCommand({
  name: "definir-capitao",
  description: "Mencione o player para definir como capitão do time.",
  options: [
    {
      name: "time",
      description: "O time que você quer definir o capitão.",
      type: ApplicationCommandOptionType.String,
      required,
      autocomplete: true,
    },
    {
      name: "jogador",
      description: "Marque o jogador que você quer definir como capitão.",
      type: ApplicationCommandOptionType.User,
      required,
    },
  ],
  type: ApplicationCommandType.ChatInput,
  async autocomplete(interaction) {
    return await AutocompleteTeamService(interaction);
  },
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await methods.deferReply();
    await DefinirCapitaoService(methods);
    // Implementar a lógica para definir o capitão do time
  },
});
