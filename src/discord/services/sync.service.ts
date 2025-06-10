import { prisma } from "#database";
import { logger } from "#settings";
import { InteractionMethodsType } from "./interaction-methods.service.js";

interface SyncServiceParams {
  methods: InteractionMethodsType;
}

export default async function SyncService({ methods }: SyncServiceParams) {
  const { guild, member, messageStack } = methods;

  // Permissão: apenas administradores
  const isAdmin = member.permissions?.has?.("Administrator");
  if (!isAdmin) {
    throw new Error("Apenas administradores podem executar o comando de sync.");
  }

  // Busca todos os membros do servidor (exceto bots)
  const guildMembers = await guild.members.fetch();
  const users = guildMembers.filter((m) => !m.user.bot);

  let created = 0;
  let updated = 0;

  for (const [, userMember] of users) {
    const player = await prisma.player.findUnique({
      where: { guildMemberId: userMember.id },
    });
    if (!player) {
      await prisma.player.create({
        data: {
          name: userMember.displayName || userMember.user.username,
          guildMemberId: userMember.id,
        },
      });
      created++;
    } else {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          name: userMember.displayName || userMember.user.username,
        },
      });
      updated++;
    }
  }

  const msg = `Sync concluído: ${created} jogadores criados, ${updated} atualizados.`;
  await messageStack.push(msg);
  logger.info(msg);
  logger.success(msg);
  return msg;
}
