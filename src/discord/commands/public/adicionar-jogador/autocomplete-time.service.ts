import { prisma } from "#database";
import { logger } from "#settings";
import { AutocompleteInteraction, PermissionsBitField } from "discord.js";

export default async function AutocompleteTeamService(
  interaction: AutocompleteInteraction<"cached">
) {
  const teamNameInput = interaction.options.getString("time");

  const member = interaction.member;

  const memberId = member.id;

  const isAdmin =
    member &&
    member.permissions &&
    member.permissions.has(PermissionsBitField.Flags.Administrator);

  try {
    let teamsQueried;

    if (isAdmin) {
      teamsQueried = await prisma.team.findMany({
        select: {
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
      logger.info(
        `Admin user ${memberId} initially fetched ${teamsQueried.length} teams.`
      );
    } else {
      const player = await prisma.player.findUnique({
        where: {
          guildMemberId: memberId,
        },
        select: {
          id: true,
        },
      });

      if (!player) {
        console.log(
          `Non-admin user ${memberId} not found as player. Input: "${
            teamNameInput || ""
          }"`
        );
        return [];
      }

      const playerId = player.id;

      teamsQueried = await prisma.team.findMany({
        where: {
          players: {
            some: {
              playerId,
            },
          },
        },
        select: {
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
      logger.info(
        `Player ${playerId} (User ${memberId}) initially fetched ${teamsQueried.length} of their teams.`
      );
    }

    let finalResults = teamsQueried;

    if (teamNameInput && teamNameInput.trim() !== "") {
      const lowerCaseInput = teamNameInput.trim().toLowerCase();
      finalResults = teamsQueried.filter((team) =>
        team.name.toLowerCase().includes(lowerCaseInput)
      );
      logger.info(`"${teamNameInput}", ${finalResults.length} teams found.`);
    }

    return finalResults
      .map((team) => ({
        name: team.name,
        value: team.name,
      }))
      .slice(0, 25);
  } catch (error) {
    logger.error("Error in autocomplete (player's teams):", error);
    return [];
  }
}
