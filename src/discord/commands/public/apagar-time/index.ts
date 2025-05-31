import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import ApagarTimeService from "./apagar-time.service.js";

createCommand({
  name: "apagar-time",
  description: "Remove um time do servidor",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "time",
      description: "command option",
      type: ApplicationCommandOptionType.Role,
      required,
    },
  ],
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await ApagarTimeService(methods);
  },
});
