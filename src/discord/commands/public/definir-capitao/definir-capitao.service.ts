import { prisma } from "#database";
import { logger } from "#settings";
import { InteractionMethodsType } from "discord/services/interaction-methods.service.js";

function handleErrorAndThrow(
  message: string,
  logFn: typeof logger.error | typeof logger.warn = logger.error
): never {
  logFn(message);
  throw new Error(message);
}

export default async function DefinirCapitaoService(
  methods: InteractionMethodsType
): Promise<void> {
  logger.info(`Iniciando serviço para definir capitão.`);

  const { getString, getMember, findRoleByName, findMemberById, messageStack } =
    methods;

  const teamNameOption = getString("time");
  const newCaptainMember = getMember("jogador");
  const captainRole = findRoleByName("Capitão");
  const teamDiscordRole = findRoleByName(teamNameOption);

  if (!teamNameOption || !newCaptainMember) {
    handleErrorAndThrow(
      "Por favor, forneça um time e um jogador para definir o capitão."
    );
  }
  logger.info(
    `Time selecionado: ${teamNameOption}, Jogador selecionado: ${newCaptainMember.displayName}`
  );

  if (!teamDiscordRole) {
    handleErrorAndThrow(
      `O cargo de time '${teamNameOption}' não foi encontrado no servidor.`
    );
  }
  logger.info(`Cargo do time encontrado: ${teamDiscordRole.name}`);

  if (!captainRole) {
    handleErrorAndThrow(
      "O cargo de 'Capitão' não foi configurado. Entre em contato com um Admin."
    );
  }
  logger.info(`Cargo de Capitão encontrado: ${captainRole.name}`);

  try {
    logger.info(
      `Buscando time no banco de dados com roleId: ${teamDiscordRole.id}`
    );
    const teamEntity = await prisma.team.findUnique({
      where: {
        roleId: teamDiscordRole.id,
      },
      include: {
        captain: {
          include: {
            captainOf: {
              select: {
                id: true,
              },
            },
          },
        },
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!teamEntity) {
      handleErrorAndThrow(
        `Não foi encontrado um time no banco de dados associado ao cargo '${teamDiscordRole.name}'. Use /criar-time.`
      );
    }
    logger.success(`Time encontrado no banco de dados: ${teamEntity.name}`);

    const newCaptainPlayerRecord = teamEntity.players.find(
      (teamPlayer) => teamPlayer.player.guildMemberId === newCaptainMember.id
    )?.player;

    if (!newCaptainPlayerRecord) {
      handleErrorAndThrow(
        `O jogador ${newCaptainMember.displayName} não pertence ao time ${teamEntity.name}.`
      );
    }
    logger.info(
      `Jogador ${newCaptainMember.displayName} confirmado como membro do time ${teamEntity.name}.`
    );

    const oldCaptainDbRecord = teamEntity.captain;

    if (oldCaptainDbRecord) {
      logger.info(
        `Antigo capitão encontrado: ID ${oldCaptainDbRecord.id} (${oldCaptainDbRecord.name}). Verificando necessidade de remover cargo.`
      );

      await prisma.player.update({
        where: { id: oldCaptainDbRecord.id },
        data: {
          captainOf: {
            disconnect: { id: teamEntity.id },
          },
        },
      });
      logger.info(
        `Antigo capitão (ID: ${oldCaptainDbRecord.id}) desassociado da capitania do time ${teamEntity.name} no DB.`
      );

      const otherTeamsCaptainedCount = oldCaptainDbRecord.captainOf.filter(
        (team) => team.id !== teamEntity.id
      ).length;

      if (otherTeamsCaptainedCount === 0) {
        const oldCaptainGuildMember = findMemberById(
          oldCaptainDbRecord.guildMemberId
        );
        if (oldCaptainGuildMember) {
          await oldCaptainGuildMember.roles.remove(captainRole);
          const demotionMessage = `O cargo de 'Capitão' foi removido do antigo capitão: ${oldCaptainGuildMember.displayName} (não capitaneia outros times).`;
          logger.info(demotionMessage);
          messageStack.push(demotionMessage);
        } else {
          logger.warn(
            `Antigo capitão (DB ID: ${oldCaptainDbRecord.id}, Discord Member ID: ${oldCaptainDbRecord.guildMemberId}) não encontrado no servidor para remover o cargo 'Capitão'.`
          );
        }
      } else {
        logger.info(
          `Antigo capitão ${oldCaptainDbRecord.name} (ID: ${oldCaptainDbRecord.id}) ainda é capitão de ${otherTeamsCaptainedCount} outro(s) time(s). O cargo 'Capitão' não será removido.`
        );
      }
    }

    await newCaptainMember.roles.add(captainRole);
    logger.info(
      `Cargo 'Capitão' (${captainRole.name}) adicionado ao novo capitão ${newCaptainMember.displayName}.`
    );

    await prisma.team.update({
      where: { id: teamEntity.id },
      data: {
        captainId: newCaptainPlayerRecord.id,
      },
    });

    const successMessage = `Capitão ${newCaptainMember.displayName} definido com sucesso para o time ${teamEntity.name}.`;
    messageStack.push(successMessage);
    logger.success(successMessage);
  } catch (err: any) {
    throw err;
  }
}
