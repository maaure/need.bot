import { createCommand } from "#base";
import { ApplicationCommandType } from "discord.js";
import SetupService from "./setup.service.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import { prisma } from "#database";

createCommand({
  name: "setup",
  description: "app command",
  type: ApplicationCommandType.ChatInput,
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await SetupService({ methods, db: prisma });
  },
});
