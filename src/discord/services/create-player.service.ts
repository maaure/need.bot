import { prisma } from "#database";
import { logger } from "#settings";
import { GuildMember } from "discord.js";
import { InteractionMethods } from "./interaction-methods.service.js";

interface CreateMemberServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
  player?: GuildMember;
}

export default async function CreateMemberService({
  methods,
  player,
}: CreateMemberServiceParams) {
  const member = methods.member ?? player;

  logger.log(`Iniciando a criação do membro: ${member.displayName}`);

  try {
    const playerEntity = await prisma.player.upsert({
      where: { guildMemberId: member.id },
      update: {
        name: member.displayName,
      },
      create: {
        name: member.displayName,
        guildMemberId: member.id,
      },
    });
    logger.success(
      `Player cadastrado ou atualizado com sucesso: ${member.displayName}`
    );
    return playerEntity;
  } catch (error) {
    const message = `Erro ao criar o membro: ${member.displayName}`;
    logger.error(message, error);
    throw new Error(message);
  }
}
