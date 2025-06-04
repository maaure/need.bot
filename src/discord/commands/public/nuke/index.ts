import { createCommand } from "#base";
import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";

createCommand({
  name: "nuke",
  description: "app command",
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,

  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });
    interaction.guild.roles.cache.forEach((role) => {
      role.delete().catch(console.error);
    });
    interaction.guild.channels.cache.forEach((channel) => {
      if (channel.name === "geral") return;
      channel.delete().catch(console.error);
    });
    await interaction.followUp({
      content:
        "Servidor limpo com sucesso! Todos os canais e cargos foram removidos.",
      ephemeral: true,
    });
  },
});
