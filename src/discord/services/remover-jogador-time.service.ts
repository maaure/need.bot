import { prisma } from "#database";
import { InteractionMethodsType } from "#services/interaction-methods.service.js";
import { logger } from "#settings";
import type { PrismaClient } from "@prisma/client";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

async function manageCaptainRole(
  methods: InteractionMethodsType,
  playerId: string,
  guildMemberId: string,
  action: "add" | "removeConditional",
  tx: PrismaTransaction
) {
  const captainRoleDiscordEntity = methods.findRoleByName("Capitão");
  if (!captainRoleDiscordEntity) {
    const msg =
      "⚠️ Cargo 'Capitão' não encontrado. A atualização de cargos de capitão pode estar incompleta.";
    logger.warn(msg);
    methods.messageStack.push(msg);
    return;
  }

  const member = methods.findMemberById(guildMemberId);
  if (!member) {
    logger.warn(
      `Membro com Discord ID ${guildMemberId} (Player DB ID: ${playerId}) não encontrado no servidor para ${action} cargo 'Capitão'.`
    );
    return;
  }

  try {
    if (action === "add") {
      if (!member.roles.cache.has(captainRoleDiscordEntity.id)) {
        await member.roles.add(captainRoleDiscordEntity);
        logger.info(`Cargo 'Capitão' adicionado a ${member.displayName}.`);
      } else {
        logger.info(
          `${member.displayName} já possui o cargo 'Capitão'. Nenhuma ação necessária.`
        );
      }
    } else if (action === "removeConditional") {
      const captainciesCount = await tx.team.count({
        where: { captainId: playerId },
      });

      if (captainciesCount - 1 === 0) {
        if (member.roles.cache.has(captainRoleDiscordEntity.id)) {
          await member.roles.remove(captainRoleDiscordEntity);
          logger.info(
            `Cargo 'Capitão' removido de ${member.displayName} (não capitaneia outros times).`
          );
          methods.messageStack.push(
            `🛡️ ${member.displayName} não é mais capitão de nenhum time, cargo 'Capitão' removido.`
          );
        }
      } else {
        logger.info(
          `${member.displayName} ainda é capitão de ${captainciesCount} time(s). Cargo 'Capitão' mantido.`
        );
      }
    }
  } catch (error) {
    logger.error(
      `Erro ao gerenciar cargo 'Capitão' para ${member.displayName}:`,
      error
    );
    methods.messageStack.push(
      `⚠️ Ocorreu um erro ao tentar atualizar o cargo 'Capitão' para ${member.displayName}.`
    );
  }
}

export default async function RemoverJogadorTimeService(
  methods: InteractionMethodsType
) {
  const teamNameOption = methods.getString("time", required);
  const leavingGuildMember = methods.getMember("jogador") ?? methods.member;

  const leavingPlayerEntity = await prisma.player.findUnique({
    where: { guildMemberId: leavingGuildMember.id },
  });

  if (!leavingPlayerEntity) {
    throw new Error(
      `${leavingGuildMember.displayName} não está registrado como jogador no bot como jogador.`
    );
  }

  const teamEntity = await prisma.team.findUnique({
    where: { name: teamNameOption },
    include: {
      captain: true, // Player record of the captain
      _count: {
        select: { players: true }, // Count of players (TeamParticipation)
      },
    },
  });

  if (!teamEntity) {
    throw new Error(`O time "${teamNameOption}" não foi encontrado.`);
  }

  const participation = await prisma.teamParticipation.findUnique({
    where: {
      playerId_teamId: {
        playerId: leavingPlayerEntity.id,
        teamId: teamEntity.id,
      },
    },
  });

  if (!participation) {
    throw new Error(
      `${leavingGuildMember.displayName} não é membro do time "${teamEntity.name}".`
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Remove player's participation from the team
      await tx.teamParticipation.delete({
        where: {
          playerId_teamId: {
            playerId: leavingPlayerEntity.id,
            teamId: teamEntity.id,
          },
        },
      });
      logger.info(
        `Jogador ${leavingPlayerEntity.name} removido da participação do time ${teamEntity.name} no DB.`
      );

      // 2. Remove Discord role for the team from the player
      const teamDiscordRole = methods.findRoleById(teamEntity.roleId);
      if (teamDiscordRole) {
        try {
          await leavingGuildMember.roles.remove(teamDiscordRole);
          methods.messageStack.push(
            `✅ ${leavingGuildMember.displayName} não faz mais parte do time ${teamEntity.name} (cargo removido).`
          );
          logger.info(
            `Cargo ${teamDiscordRole.name} removido do jogador ${leavingGuildMember.displayName}.`
          );
        } catch (roleError) {
          logger.error(
            `Falha ao remover cargo ${teamDiscordRole.name} de ${leavingGuildMember.displayName}:`,
            roleError
          );
          methods.messageStack.push(
            `⚠️ Não foi possível remover o cargo do time ${teamDiscordRole.name}.`
          );
        }
      } else {
        logger.warn(
          `Cargo do time ${teamEntity.name} (ID: ${teamEntity.roleId}) não encontrado no servidor.`
        );
        methods.messageStack.push(
          `⚠️ Cargo do time ${teamEntity.name} não encontrado, não foi possível remover.`
        );
      }

      // 3. Check remaining players
      const remainingParticipations = await tx.teamParticipation.findMany({
        where: { teamId: teamEntity.id },
        include: { player: true },
      });

      const wasCaptain = teamEntity.captainId === leavingPlayerEntity.id;

      if (remainingParticipations.length === 0) {
        // Team is now empty
        methods.messageStack.push(
          `ℹ️ ${leavingGuildMember.displayName} era o último membro do time ${teamEntity.name}. O time será desfeito.`
        );
        logger.info(
          `Time ${teamEntity.name} ficou vazio após saída de ${leavingPlayerEntity.name}. Iniciando processo de exclusão do time.`
        );

        // If the leaver was the captain, manage their "Capitão" role
        if (wasCaptain) {
          // The team is being deleted, so the captaincy of THIS team is gone.
          // We need to check if they captain OTHER teams.
          // The team's captainId will be gone when the team is deleted.
          await manageCaptainRole(
            methods,
            leavingPlayerEntity.id,
            leavingGuildMember.id,
            "removeConditional",
            tx
          );
        }

        // Delete voice channel
        const voiceChannel = methods.findVoiceChannel(teamEntity.name);
        if (voiceChannel) {
          try {
            await voiceChannel.delete(
              `Time ${teamEntity.name} desfeito por falta de membros.`
            );
            methods.messageStack.push(
              `🎤 Canal de voz "${teamEntity.name}" apagado.`
            );
            logger.info(`Canal de voz ${teamEntity.name} apagado.`);
          } catch (vcError) {
            logger.error(
              `Erro ao apagar canal de voz ${teamEntity.name}:`,
              vcError
            );
            methods.messageStack.push(`⚠️ Erro ao apagar canal de voz.`);
          }
        }

        // Delete team role (already got it as teamDiscordRole)
        if (teamDiscordRole) {
          try {
            await teamDiscordRole.delete(
              `Time ${teamEntity.name} desfeito por falta de membros.`
            );
            methods.messageStack.push(`🛡️ Cargo "${teamEntity.name}" apagado.`);
            logger.info(`Cargo ${teamEntity.name} apagado.`);
          } catch (roleDelError) {
            logger.error(
              `Erro ao apagar cargo ${teamEntity.name}:`,
              roleDelError
            );
            methods.messageStack.push(`⚠️ Erro ao apagar o cargo do time.`);
          }
        }

        // Delete team from DB
        await tx.team.delete({ where: { id: teamEntity.id } });
        methods.messageStack.push(
          `🗑️ O time ${teamEntity.name} foi completamente removido do sistema.`
        );
        logger.info(`Time ${teamEntity.name} removido do banco de dados.`);
      } else {
        // Team still has members
        if (wasCaptain) {
          methods.messageStack.push(
            `ℹ️ ${leavingGuildMember.displayName} era o capitão do time ${teamEntity.name}. Um novo capitão será escolhido.`
          );
          logger.info(
            `Capitão ${leavingPlayerEntity.name} saiu do time ${teamEntity.name}. Escolhendo novo capitão.`
          );

          // Manage "Capitão" role for the leaving captain
          await manageCaptainRole(
            methods,
            leavingPlayerEntity.id,
            leavingGuildMember.id,
            "removeConditional",
            tx
          );

          // Select a new captain randomly
          const newCaptainParticipation =
            remainingParticipations[
              Math.floor(Math.random() * remainingParticipations.length)
            ];
          const newCaptainPlayerEntity = newCaptainParticipation.player;

          // Update team's captain in DB
          await tx.team.update({
            where: { id: teamEntity.id },
            data: { captainId: newCaptainPlayerEntity.id },
          });
          logger.info(
            `Novo capitão ${newCaptainPlayerEntity.name} (ID: ${newCaptainPlayerEntity.id}) definido para o time ${teamEntity.name} no DB.`
          );

          // Add "Capitão" role to the new captain
          await manageCaptainRole(
            methods,
            newCaptainPlayerEntity.id,
            newCaptainPlayerEntity.guildMemberId,
            "add",
            tx
          );
          methods.messageStack.push(
            `👑 ${newCaptainPlayerEntity.name} é o novo capitão do time ${teamEntity.name}!`
          );
        }
      }
    }); // End of Prisma transaction
  } catch (error) {
    logger.error(`Erro na transação do comando /sair-time:`, error);
    if (error instanceof Error) {
      throw new Error(
        `Ocorreu um erro ao processar sua saída do time: ${error.message}`
      );
    }
    throw new Error("Ocorreu um erro desconhecido ao tentar sair do time.");
  }

  await methods.editReply(methods.messageStack.getCurrentMessageBody());
}
