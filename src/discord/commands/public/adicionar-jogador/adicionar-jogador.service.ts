import { prisma } from "#database";
import { logger } from "#settings";
import { findRole } from "@magicyan/discord";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
// Se 'player' for um tipo específico como GuildMember do discord.js, você pode querer importá-lo para melhor type-safety
// import { GuildMember } from "discord.js";

export default async function AdicionarJogadorService(
  methods: ReturnType<typeof InteractionMethods>
) {
  const teamName = methods.getString("time");
  const player = methods.getMember("jogador");

  if (!player) {
    const message = "Você não mencionou um jogador válido.";
    logger.error(message);
    throw new Error(message);
  }

  if (!teamName) {
    const message = "O nome do time não foi fornecido.";
    logger.error(message);
    throw new Error(message);
  }

  const teamEntity = await prisma.team.findUnique({
    where: { name: teamName },
  });

  if (!teamEntity) {
    const message = `O time "${teamName}" não existe.`;
    logger.error(message);
    throw new Error(message);
  }
  const teamRole = findRole(methods.guild).byId(teamEntity.roleId);

  if (!teamRole) {
    const message = `O cargo do time "${teamEntity.name}" não foi encontrado.`;
    logger.error(message);
    throw new Error(message);
  }

  const guildMemberId = player.id;
  const playerName = player.displayName || player.user.username;
  logger.log(
    `Iniciando o processo de adição do jogador ${playerName} (Discord ID: ${guildMemberId}) ao time ${teamName}.`
  );
  player.roles.add(teamEntity.roleId);

  const playerEntity = await prisma.player.upsert({
    where: { guildMemberId: guildMemberId },
    update: {
      name: playerName,
    },
    create: {
      name: playerName,
      guildMemberId: guildMemberId,
    },
  });
  logger.success(
    `Jogador ${playerEntity.name} (Discord ID: ${guildMemberId}) processado/assegurado no banco.`
  );

  const existingParticipation = await prisma.teamParticipation.findUnique({
    where: {
      playerId_teamId: {
        playerId: playerEntity.id,
        teamId: teamEntity.id,
      },
    },
  });

  if (existingParticipation) {
    const message = `O jogador ${playerEntity.name} já faz parte do time ${teamEntity.name}.`;
    logger.log(message);
    throw new Error(message);
  }

  // 3. Adicionar o jogador ao time criando um registro em TeamParticipation
  await prisma.teamParticipation.create({
    data: {
      playerId: playerEntity.id,
      teamId: teamEntity.id,
    },
  });

  // 4. Adicionar o cargo do time ao jogador no Discord
  await player.roles.add(teamRole);

  const successMessage = `O jogador ${methods.member.displayName} foi adicionado ao time ${teamEntity.name} com sucesso!`;
  logger.log(successMessage);
  await methods.followUp(successMessage);
}
