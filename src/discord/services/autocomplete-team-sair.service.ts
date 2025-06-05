import { prisma } from "#database";
import { logger } from "#settings";
import { AutocompleteInteraction } from "discord.js";

export default async function AutocompleteMemberTeam(
  interaction: AutocompleteInteraction<"cached">
) {
  const focusedValue = interaction.options.getFocused().trim().toLowerCase();
  const memberId = interaction.member.id;

  try {
    const player = await prisma.player.findUnique({
      where: { guildMemberId: memberId },
    });

    console.log("Fui encontrado como jogador? ", player);

    if (!player) {
      return [];
    }

    const teamsParticipating = await prisma.team.findMany({
      where: {
        players: {
          some: {
            playerId: player.id,
          },
        },
        ...(focusedValue && {
          name: {
            contains: focusedValue,
          },
        }),
      },
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 25,
    });

    return teamsParticipating.map((team) => ({
      name: team.name,
      value: team.name,
    }));
  } catch (error) {
    logger.error("Error in autocomplete (sair-time):", error);
    return [];
  }
}
