import { createCommand } from "#base";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionsBitField,
} from "discord.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import AdicionarJogadorService from "./adicionar-jogador.service.js";
import { prisma } from "#database";
import { logger } from "#settings";

createCommand({
  name: "adicionar-jogador",
  description: "Adicione um jogador a algum time",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "time",
      description: "O time que você quer adicionar o jogador.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "jogador",
      description: "Marque o jogador que você quer adicionar ao seu time.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  async autocomplete(interaction) {
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
  },
  async run(interaction) {
    const methods = InteractionMethods(interaction);
    await methods.deferReply();
    await AdicionarJogadorService(methods);
  },
});
