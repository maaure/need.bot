import { prisma } from "#database";
import { logger } from "#settings";
import { InteractionMethods } from "./interaction-methods.service.js";

interface CreateMemberServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
}

export default async function CreateMemberService({
  methods,
}: CreateMemberServiceParams) {
  const { member } = methods;

  logger.log(`Iniciando a criação do membro: ${member.displayName}`);

  try {
    const playerEntity = await prisma.player.upsert({
      where: { memberId: member.id },
      update: {
        name: member.displayName,
      },
      create: {
        name: member.displayName,
        memberId: member.id,
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
