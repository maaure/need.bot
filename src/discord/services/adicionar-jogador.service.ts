import { prisma } from "#database";
import { InteractionMethodsType } from "#services/interaction-methods.service.js";
import { logger } from "#settings";
import { findRole } from "@magicyan/discord";
import { PermissionFlagsBits } from "discord.js";

export default async function AdicionarJogadorService(
  methods: InteractionMethodsType
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
    include: {
      players: true,
    },
  });

  console.log(teamEntity);

  if (!teamEntity) {
    const message = `O time "${teamName}" não existe.`;
    logger.error(message);
    throw new Error(message);
  }

  if (!methods.member.permissions.has(PermissionFlagsBits.Administrator)) {
    const existingPlayer = await prisma.player.findUnique({
      where: { guildMemberId: methods.member.id },
    });

    if (!existingPlayer)
      throw new Error(
        "Houve um erro inesperado durante o cadastro do novo membro."
      );

    const participation = await prisma.teamParticipation.findUnique({
      where: {
        playerId_teamId: {
          playerId: existingPlayer.id,
          teamId: teamEntity.id,
        },
      },
    });

    if (!participation)
      throw new Error(
        "Você não pode adicionar um jogador a um time que você não faz parte."
      );
  } else {
    logger.success("Adminstrador adicionando player ao time");
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

  // Regra: só pode estar em um time por modalidade
  // Busca a modalidade do time
  const teamWithModality = await prisma.team.findUnique({
    where: { id: teamEntity.id },
    include: { modality: true },
  });
  if (!teamWithModality?.modality) {
    throw new Error("A modalidade do time não foi encontrada.");
  }
  // Verifica se o jogador já está em outro time dessa modalidade
  const participacaoMesmaModalidade = await prisma.teamParticipation.findFirst({
    where: {
      playerId: playerEntity.id,
      team: {
        modalityId: teamWithModality.modality.id,
        id: { not: teamEntity.id },
      },
    },
    include: { team: true },
  });
  if (participacaoMesmaModalidade) {
    throw new Error(
      `O jogador ${playerEntity.name} já está no time "${participacaoMesmaModalidade.team.name}" da modalidade "${teamWithModality.modality.name}".`
    );
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
