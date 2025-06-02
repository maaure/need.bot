import { prisma } from "#database";
import { logger } from "#settings";
import { PrismaClient } from "@prisma/client/extension";
import { Role } from "discord.js";
import CreateChannelCategoryIfNotExistsService from "discord/services/create-categoria.service.js";
import CreateRoleCapitaoIfNotExistsService from "discord/services/create-role-capitao.service.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import { modalidades } from "utils/modalidades.service.js";

interface SetupServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
  db: PrismaClient;
}

export default async function SetupService({ methods }: SetupServiceParams) {
  await methods.deferReply();
  await CreateRoleCapitaoIfNotExistsService({ methods });
  const modalities: Array<Role> = [];
  await methods.editReply(
    "Iniciando a configuração do servidor. Isso pode levar alguns minutos."
  );
  logger.log("Iniciando a configuração do servidor.");
  logger.log("Iniciando a criação dos papéis para as modalidades.");

  (Object.keys(modalidades) as Array<keyof typeof modalidades>).map(
    async (key) => {
      try {
        const existingRole = methods.findRoleByName(key);
        if (existingRole) {
          logger.log(`Papel '${key}' já existe. Pulando criação.`);
          modalities.push(existingRole);
          return;
        }

        const role = await methods.createRoleIfNotExists({
          name: key,
          color: modalidades[key].cor,
          permissions: [],
          mentionable: true,
        });
        modalities.push(role);
        logger.success(`Papel '${key}' criado com sucesso.`);
      } catch (error) {
        logger.error(`Error creating role '${key}':`, error);
        throw new Error(
          `Houve um erro ao tentar criar o cargo para a modalidade ${key}`
        );
      }
    }
  );
  /* Cria as separações (categorias) dos canais de voz dos times */
  logger.log(
    "Iniciando a criação das categorias para os canais de voz dos times."
  );
  for (const { name } of modalities) {
    try {
      await CreateChannelCategoryIfNotExistsService({
        methods,
        categoryName: `Times de ${name}`,
      });
      logger.success(`Category '${name}' ensured.`);
    } catch (categoryError) {
      logger.error(`Error ensuring category '${name}':`, categoryError);
    }
  }
  logger.success(
    "Categorias para os canais de voz dos times criadas com sucesso."
  );

  try {
    logger.log(
      "Iniciando a persistência/atualização das modalidades no banco de dados."
    );

    for (const role of modalities) {
      try {
        await prisma.modality.upsert({
          where: { name: role.name },
          update: { roleId: role.id },
          create: {
            name: role.name,
            roleId: role.id,
          },
        });
        logger.success(
          `Modalidade '${role.name}' (Role ID: ${role.id}) persistida/atualizada no banco de dados.`
        );
      } catch (dbProcessingError) {
        logger.error(
          `Erro ao processar a modalidade '${role.name}' no banco de dados:`,
          dbProcessingError
        );
      }
    }
    logger.success(
      "Modalidades persistidas/atualizadas no banco de dados com sucesso."
    );
  } catch (err) {
    const message = `Erro geral durante a persistência/atualização das modalidades.`;
    logger.error(message, err);
    throw new Error(message);
  }
  await methods.editReply(
    "Configuração concluída com sucesso! As modalidades e categorias foram criadas."
  );
  logger.success("Configuração concluída com sucesso!");
}
