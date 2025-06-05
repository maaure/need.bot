import { createCommand } from "#base";
import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import SetupService from "./setup.service.js";
import { InteractionMethods } from "#services/interaction-methods.service.js";

createCommand({
  name: "setup",
  description:
    "Esse comando cria os canais e cargos necessários para o funcionamento do bot.",
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,

  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await SetupService({ methods });
  },
});
