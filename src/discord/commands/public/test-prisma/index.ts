import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import { createCommand } from "#base"; //
import { prisma } from "#database";

createCommand({
  name: "test-prisma-add",
  description: "Adds a test entity to the Prisma database.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "name",
      description: "The name for the test entity.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "value",
      description: "An integer value for the test entity.",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
  async run(interaction) {
    await interaction.deferReply({ flags });

    const entityName = interaction.options.getString("name", true);
    const entityValue = interaction.options.getInteger("value", true);

    try {
      const newEntity = await prisma.testEntity.create({
        data: {
          name: entityName,
          value: entityValue,
        },
      });
      await interaction.editReply({
        content: `✅ Entity created successfully!\nID: ${newEntity.id}\nName: ${newEntity.name}\nValue: ${newEntity.value}`,
      });
    } catch (error) {
      let errorMessage = "❌ Failed to create entity.";
      if (error instanceof Error) {
        errorMessage += `\nError: ${error.message}`;
      }
      await interaction.editReply({
        content: errorMessage,
      });
    }
  },
});
