import { prisma } from "#database";
import { logger } from "#settings";
import { Colors, PermissionFlagsBits } from "discord.js";
import { InteractionMethodsType } from "./interaction-methods.service.js";

export default async function AlterarCorTimeService(
  methods: InteractionMethodsType
) {
  const { getString, findRoleByName, messageStack, member } = methods;
  const color = getString("cor");
  const teamName = getString("time");

  // Validação: nome do time informado
  if (!teamName) {
    throw new Error("Nome do time não informado.");
  }

  // Validação: cor informada
  if (!color) {
    throw new Error("Cor não informada.");
  }

  // Validação: cor existe em Colors
  if (!(color in Colors)) {
    throw new Error("Cor inválida. Escolha uma cor válida.");
  }

  // Validação: nome do time não pode ser menção
  const invalidMentionRegex = /<@!? 5c\d+>|<@&\d+>|<#\d+>/;
  if (invalidMentionRegex.test(teamName)) {
    throw new Error("O nome do time não pode ser uma menção do Discord.");
  }

  // Busca o cargo do time
  const teamRole = findRoleByName(teamName);
  if (!teamRole) {
    throw new Error("Cargo do time não encontrado.");
  }

  // Busca o time no banco, incluindo o capitão e jogadores
  const teamEntity = await prisma.team.findUnique({
    where: { name: teamName },
    include: { captain: true, players: { include: { player: true } } },
  });
  if (!teamEntity) {
    throw new Error("Time não encontrado no banco de dados.");
  }

  // Validação: só administradores ou membros do time podem alterar a cor
  const isAdmin = member.permissions?.has?.(PermissionFlagsBits.Administrator);
  const isTeamMember = teamEntity.players.some(
    (p) => p.player.guildMemberId === member.id
  );
  if (!isAdmin && !isTeamMember) {
    throw new Error(
      "Apenas administradores ou membros do time podem alterar a cor do time."
    );
  }

  // Validação: apenas capitão pode alterar a cor do cargo
  if (!teamEntity.captain || teamEntity.captain.guildMemberId !== member.id) {
    throw new Error("Apenas o capitão do time pode alterar a cor do cargo.");
  }

  // Validação: cor já está em uso
  const colorValue = Colors[color as keyof typeof Colors];
  if (teamRole.color === colorValue) {
    throw new Error("O cargo já está com essa cor.");
  }

  // Tenta alterar a cor do cargo
  try {
    await teamRole.setColor(colorValue, "Cor alterada pelo capitão do time.");
    await messageStack.push(`Cor do time alterada para ${color} com sucesso!`);
    logger.info(`Cor do time '${teamName}' alterada para ${color}.`);
    logger.success(`Cor do time '${teamName}' alterada para ${color}.`);
  } catch (err) {
    logger.error("Erro ao alterar a cor do cargo do time:", err);
    throw new Error(
      "Erro ao alterar a cor do cargo do time. Tente novamente mais tarde."
    );
  }
}
