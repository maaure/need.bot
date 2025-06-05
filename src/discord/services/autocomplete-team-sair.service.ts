import { prisma } from "#database";
import { logger } from "#settings";
import { AutocompleteInteraction } from "discord.js";

interface AutocompleteMemberTeamParams {
  interaction: AutocompleteInteraction<"cached">;
  listAll?: boolean;
}

export default async function AutocompleteMemberTeam({
  interaction,
  listAll = false,
}: AutocompleteMemberTeamParams) {
  const focusedValue = interaction.options.getFocused().trim().toLowerCase();
  const memberId = interaction.member.id;

  try {
    const player = await prisma.player.findUnique({
      where: { guildMemberId: memberId },
    });

    if (!player && !listAll) {
      return [];
    }

    const teamsParticipating = await prisma.team.findMany({
      where: {
        ...(!listAll &&
          player && {
            players: {
              some: {
                playerId: player.id,
              },
            },
          }),
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
