import { prisma } from "#database";
import { logger } from "#settings";
import { Role } from "discord.js";
import { modalidades as modalidadesDefinition } from "#utils/modalidades.service.js";
import CreateChannelCategoryIfNotExistsService from "#services/create-categoria.service.js";
import CreateRoleCapitaoIfNotExistsService from "#services/create-role-capitao.service.js";
import { InteractionMethodsType } from "#services/interaction-methods.service.js";

interface SetupServiceParams {
  methods: InteractionMethodsType;
}

export default async function SetupService({ methods }: SetupServiceParams) {
  const { messageStack } = methods;

  await messageStack.push(
    "🚀 Iniciando a configuração do servidor. Isso pode levar alguns minutos..."
  );
  logger.log("Iniciando a configuração do servidor.");

  // 1. Create Capitão Role
  try {
    await messageStack.push("ℹ️ Configurando cargo de Capitão...");
    await CreateRoleCapitaoIfNotExistsService({ methods });
    await messageStack.push("✅ Cargo de Capitão configurado com sucesso!");
    logger.log("Cargo de Capitão configurado.");
  } catch (error) {
    logger.error("Erro ao configurar cargo de Capitão:", error);
    await messageStack.push(
      `❌ Falha ao configurar o cargo de Capitão: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`
    );
    await methods.editReply(messageStack.getCurrentMessageBody());
    throw new Error("Falha na configuração do cargo de Capitão.");
  }

  // 2. Create Modality Roles
  await messageStack.push(
    "\nℹ️ Iniciando criação dos papéis para as modalidades..."
  );
  logger.log("Iniciando a criação dos papéis para as modalidades."); //

  const createdModalityRoles: Array<Role> = [];
  const modalityKeys = Object.keys(modalidadesDefinition) as Array<
    keyof typeof modalidadesDefinition
  >;

  for (const key of modalityKeys) {
    try {
      await messageStack.push(
        `⏳ Verificando/criando papel para modalidade '${key}'...`
      );
      const existingRole = methods.findRoleByName(key);
      if (existingRole) {
        logger.log(`Papel '${key}' já existe. Pulando criação.`);
        createdModalityRoles.push(existingRole);
        await messageStack.push(`☑️ Papel '${key}' já existente.`);
      } else {
        const role = await methods.createRoleIfNotExists({
          name: key,
          color: modalidadesDefinition[key].cor,
          permissions: [],
          mentionable: true,
        });
        createdModalityRoles.push(role);
        logger.success(`Papel '${key}' criado com sucesso.`);
        await messageStack.push(`✅ Papel '${key}' criado com sucesso.`);
      }
    } catch (error) {
      const errorMessage = `Houve um erro ao tentar criar o cargo para a modalidade ${key}`;
      logger.error(`Error creating role '${key}':`, error);
      await messageStack.push(
        `❌ ${errorMessage}: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
      await methods.editReply(messageStack.getCurrentMessageBody());
      throw new Error(errorMessage);
    }
  }
  await messageStack.push("👍 Papéis de modalidades configurados com sucesso!");
  logger.success("Papéis para as modalidades criados com sucesso.");

  // 3. Create Channel Categories for Modalities
  await messageStack.push(
    "\nℹ️ Iniciando criação das categorias para os canais de voz dos times..."
  );
  logger.log(
    "Iniciando a criação das categorias para os canais de voz dos times." //
  );

  for (const role of createdModalityRoles) {
    // Uses the sequentially created roles
    try {
      await messageStack.push(
        `⏳ Verificando/criando categoria para times de '${role.name}'...`
      );
      await CreateChannelCategoryIfNotExistsService({
        methods,
        categoryName: `Times de ${role.name}`,
      });
      logger.success(`Categoria 'Times de ${role.name}' assegurada.`);
      await messageStack.push(
        `✅ Categoria 'Times de ${role.name}' configurada.`
      );
    } catch (categoryError) {
      const errorMessage = `Erro ao assegurar categoria para '${role.name}'`;
      logger.error(errorMessage + ":", categoryError);
      await messageStack.push(
        `❌ ${errorMessage}: ${
          categoryError instanceof Error
            ? categoryError.message
            : "Erro desconhecido"
        }`
      );
      await methods.editReply(messageStack.getCurrentMessageBody());
      throw new Error(errorMessage);
    }
  }
  await messageStack.push(
    "👍 Categorias para os canais de voz dos times criadas com sucesso!"
  );
  logger.success(
    "Categorias para os canais de voz dos times criadas com sucesso." //
  );

  // 4. Persist Modalities in Database
  await messageStack.push(
    "\nℹ️ Iniciando persistência das modalidades no banco de dados..."
  );
  logger.log(
    "Iniciando a persistência/atualização das modalidades no banco de dados." //
  );

  for (const role of createdModalityRoles) {
    try {
      await messageStack.push(
        `💾 Registrando modalidade '${role.name}' no banco de dados...`
      );
      await prisma.modality.upsert({
        //
        where: { name: role.name }, //
        update: { roleId: role.id }, //
        create: {
          //
          name: role.name,
          roleId: role.id,
        },
      });
      logger.success(
        `Modalidade '${role.name}' (Role ID: ${role.id}) persistida/atualizada no banco de dados.` //
      );
      await messageStack.push(
        `✅ Modalidade '${role.name}' (Role ID: ${role.id}) registrada.`
      );
    } catch (dbProcessingError) {
      const errorMessage = `Erro ao processar a modalidade '${role.name}' no banco de dados`;
      logger.error(
        errorMessage + ":", //
        dbProcessingError
      );
      await messageStack.push(
        `❌ ${errorMessage}: ${
          dbProcessingError instanceof Error
            ? dbProcessingError.message
            : "Erro desconhecido"
        }`
      );
      // Decide if this is critical enough to stop the whole setup.
      // For now, let's log and continue, as roles/categories might be fine.
      // If it needs to be critical, uncomment the next lines:
      // await methods.editReply(messageStack.getCurrentMessageBody());
      // throw new Error(errorMessage);
    }
  }
  await messageStack.push(
    "👍 Modalidades persistidas/atualizadas no banco de dados com sucesso!"
  );
  logger.success(
    "Modalidades persistidas/atualizadas no banco de dados com sucesso." //
  );

  await messageStack.push(
    "\n🎉 Configuração concluída com sucesso! As modalidades, cargos e categorias foram criadas/verificadas."
  );
  await methods.editReply(messageStack.getCurrentMessageBody());
  logger.success("Configuração concluída com sucesso!"); //
}
