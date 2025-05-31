import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import getColors from "utils/getColors.js";
import getModalidadesChoices from "utils/modalidades.service.js";
import CriarTimeService from "./criar-time.service.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";

createCommand({
  name: "criar-time",
  description: "Configure seu cargo e seu time aqui no servidor!",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "modalidade",
      description: "Defina qual a modalidade do seu time",
      type: ApplicationCommandOptionType.String,
      choices: getModalidadesChoices(),
      required,
    },
    {
      name: "nome-do-time",
      description: "Qual o nome do seu time?",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "capitao",
      description:
        "MEncione quem será o capitão do seu time, se não informado, você será cadastrado como capitão",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "cor",
      description: "Escolha a cor do cargo do seu time",
      type: ApplicationCommandOptionType.String,
      autocomplete,
      // choices: getColors(),
    },
  ],
  async autocomplete(interaction) {
    const cor = interaction.options.getString("cor");
    return getColors(cor);
  },
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    interaction.deferReply({ flags });
    await CriarTimeService(methods);
  },
});
