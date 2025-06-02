import { prisma } from "#database";
import { logger } from "#settings";
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

  /* Implemente aqui a query. Adicione o team à lista de times que o player pode estar. Crie o player se nao existir, se existir. Player.teams.add(teamEntity) */
  try {
    // 1. Encontrar ou Criar a entidade Player no banco de dados
    // Assumindo que 'discordMember' tem 'id' e 'displayName' (ou user.username)
    // como em um objeto GuildMember do discord.js
    const guildMemberId = player.id;
    const playerName = player.displayName || player.user.username;

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
    logger.log(
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
    const teamRole = methods.findRoleByName(teamEntity.name);
    if (!teamRole) {
      const message = `O cargo do time "${teamEntity.name}" não foi encontrado.`;
      logger.error(message);
      throw new Error(message);
    }
    await player.roles.add(teamRole);

    const successMessage = `O jogador ${playerEntity.name} foi adicionado ao time ${teamEntity.name} com sucesso!`;
    logger.log(successMessage);
    await methods.followUp(successMessage);
  } catch (error) {
    logger.error(
      `Erro ao adicionar jogador (Discord ID: ${player?.id}) ao time ${teamName}:`,
      error
    );
    const errorMessage =
      "Ocorreu um erro ao tentar adicionar o jogador ao time. Por favor, tente novamente.";
    throw new Error(errorMessage);
  }
}
