import { prisma } from "#database";
import { logger } from "#settings";
import { InteractionMethodsType } from "./interaction-methods.service.js";

export default async function ApagarTimeService(
  methods: InteractionMethodsType
) {
  const {
    getRole,
    findVoiceChannel,
    messageStack,
    findMemberById,
    findRoleByName,
  } = methods;

  const teamRole = getRole("time");

  if (!teamRole) {
    throw new Error(
      "O cargo do time especificado não foi encontrado ou é inválido."
    );
  }

  await messageStack.push(
    `🚀 Iniciando a exclusão completa do time: **${teamRole.name}**...`
  );

  const teamEntity = await prisma.team.findUnique({
    where: { roleId: teamRole.id },
    include: { captain: true },
  });

  if (teamEntity) {
    logger.info(
      `Time "${teamEntity.name}" encontrado no banco de dados. Iniciando limpeza.`
    );
    try {
      const captainEntity = teamEntity.captain;

      await prisma.$transaction(async (tx) => {
        await tx.teamParticipation.deleteMany({
          where: { teamId: teamEntity.id },
        });
        await tx.team.delete({
          where: { id: teamEntity.id },
        });
      });

      if (captainEntity) {
        const otherCaptaincies = await prisma.team.count({
          where: { captainId: captainEntity.id },
        });

        if (otherCaptaincies === 0) {
          const captainRole = findRoleByName("Capitão");
          const captainMember = findMemberById(captainEntity.guildMemberId);
          if (
            captainRole &&
            captainMember &&
            captainMember.roles.cache.has(captainRole.id)
          ) {
            await captainMember.roles.remove(captainRole);
            await messageStack.push(
              `🛡️ Cargo 'Capitão' removido de ${captainMember.displayName}, pois ele não lidera mais nenhum time.`
            );
          }
        }
      }

      await messageStack.push(
        "✔️ Registros do time removidos do banco de dados."
      );
      logger.success(
        `Registros do time "${teamEntity.name}" removidos do banco de dados.`
      );
    } catch (dbError) {
      logger.error(
        `Erro ao apagar o time "${teamEntity.name}" do banco de dados:`,
        dbError
      );
      await messageStack.push(
        `❌ Ocorreu um erro ao limpar os dados do time no banco de dados. A exclusão continuará com os recursos do Discord.`
      );
    }
  } else {
    logger.warn(
      `O cargo "${teamRole.name}" não possui uma entrada correspondente no banco de dados. Procedendo com a limpeza dos recursos do Discord.`
    );
    await messageStack.push(
      `⚠️ O cargo "${teamRole.name}" não foi encontrado no banco de dados. Limpando apenas os recursos do Discord.`
    );
  }

  const voiceChannel = findVoiceChannel(teamRole.name);
  if (voiceChannel) {
    try {
      await voiceChannel.delete(
        `Time ${teamRole.name} apagado por um administrador.`
      );
      await messageStack.push(
        `🎤 Canal de voz "${voiceChannel.name}" apagado com sucesso.`
      );
      logger.info(`Canal de voz "${voiceChannel.name}" apagado.`);
    } catch (channelError) {
      logger.error(
        `Erro ao apagar o canal de voz para o time ${teamRole.name}:`,
        channelError
      );
      await messageStack.push(
        `❌ Erro ao apagar o canal de voz "${teamRole.name}".`
      );
    }
  } else {
    await messageStack.push(
      `☑️ Nenhum canal de voz correspondente a "${teamRole.name}" encontrado.`
    );
  }

  try {
    const roleName = teamRole.name;
    await teamRole.delete(`Time ${roleName} apagado por um administrador.`);
    await messageStack.push(`🛡️ Cargo "${roleName}" apagado com sucesso.`);
    logger.info(`Cargo "${roleName}" apagado.`);
  } catch (roleError) {
    logger.error(`Erro ao apagar o cargo ${teamRole.name}:`, roleError);
    await messageStack.push(`❌ Erro ao apagar o cargo "${teamRole.name}".`);
    await methods.editReply(messageStack.getCurrentMessageBody());
    throw new Error(
      `Falha crítica ao apagar o cargo do time. A operação foi interrompida.`
    );
  }

  await messageStack.push(`\n🎉 Exclusão do time concluída.`);
  await methods.editReply(messageStack.getCurrentMessageBody());
}
