import { createCommand } from "#base";
import { InteractionMethods } from "#services/interaction-methods.service.js";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionFlagsBits,
} from "discord.js";
import SyncService from "#services/sync.service.js";
import SetupService from "#services/setup.service.js";

createCommand({
  name: "admin",
  description: "Comandos ",
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "setup",
      description: "command option",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "sync",
      description: "command option",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const methods = InteractionMethods(interaction);
    await methods.deferReply();

    switch (subCommand) {
      case "setup":
        await SetupService({ methods });
        return;

      case "sync":
        await SyncService({ methods });
        return;

      default:
        methods.editReply("Comando não encontrado.");
        return;
    }
  },
});
