import { Colors } from "discord.js";
import { InteractionMethodsType } from "./interaction-methods.service.js";
import { logger } from "#settings";
import { prisma } from "#database";

interface CreateTeamServiceParam {
  methods: InteractionMethodsType;
  teamName: string;
  teamColor: keyof typeof Colors;
}

export default async function CreateTeamService({
  methods,
  teamName,
  teamColor,
}: CreateTeamServiceParam) {
  logger.log(`Iniciando a criação do time: ${teamName}`);
  const { findRoleByName, createRole } = methods;
  const role = findRoleByName(teamName);

  if (role) {
    const message = `O cargo do time ${teamName} já existe. Por favor, verifique se esse cargo é o seu, se não escolha outro nome.`;
    logger.error(message);
    throw new Error(message);
  }

  const teamRole = await createRole({
    name: teamName,
    color: teamColor,
    permissions: [],
    mentionable: true,
  });

  if (!teamRole) {
    logger.error(`Erro ao criar o cargo do time: ${teamName}`);
    throw new Error(`Houve um erro ao tentar criar o time: ${teamName}`);
  }

  let teamEntity = await prisma.team.findUnique({
    where: { name: teamName },
  });

  if (!teamEntity) {
    try {
      teamEntity = await prisma.team.create({
        data: {
          name: teamName,
          roleId: teamRole.id,
        },
      });
    } catch (error) {
      logger.error(
        `Erro ao criar a entidade do time no banco de dados: ${error}`
      );
      throw new Error(`Houve um erro ao tentar criar o time: ${teamName}`);
    }
  }

  return { teamRole, teamEntity };
}
