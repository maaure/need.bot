import { setupCreators } from "#base";
import { InteractionReplyOptions } from "discord.js";

export const { createCommand, createEvent, createResponder } = setupCreators({
  commands: {
    async onError(error, interaction) {
      if (error instanceof Error) {
        const options = {
          content: ` ❌ ${error.message}`,
          flags,
        } satisfies InteractionReplyOptions;

        await interaction
          .reply(options)
          .catch(() => interaction.followUp(options))
          .catch(() => interaction.editReply({ content: options.content }))
          .catch(() => null);
        return;
      }

      await interaction.reply({
        content: "❌ Ocorreu um erro desconhecido.",
      });
    },
  },
});
