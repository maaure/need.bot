import { setupCreators } from "#base";
import { InteractionReplyOptions } from "discord.js";

export const { createCommand, createEvent, createResponder } = setupCreators({
  commands: {
    async onError(error, interaction) {
      if (error instanceof Error) {
        const options = {
          content: error.message,
          flags,
        } satisfies InteractionReplyOptions;

        await interaction
          .reply(options)
          .catch(() => interaction.followUp(options))
          .catch(() => null);
        return;
      }
    },
  },
});
