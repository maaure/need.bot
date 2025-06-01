import { logger } from "#settings";
import { PrismaClient } from "@prisma/client/extension";
import CreateChannelCategoryIfNotExistsService from "discord/services/create-categoria.service.js";
import CreateRoleCapitaoIfNotExistsService from "discord/services/create-role-capitao.service.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import { modalidades } from "utils/modalidades.service.js";

interface SetupServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
  db: PrismaClient;
}

export default async function SetupService({
  methods,
  db,
}: SetupServiceParams) {
  await CreateRoleCapitaoIfNotExistsService({ methods });
  const categories: string[] = [];

  /* Cria os papéis para as modalidades, ex: Valorant, League of Legends, Counter-Strike, etc... */
  (Object.keys(modalidades) as Array<keyof typeof modalidades>).map(
    async (key) => {
      categories.push(`Time - ${key}`);
      const role = await methods.createRoleIfNotExists({
        name: key,
        color: modalidades[key].cor,
        permissions: [],
        mentionable: true,
      });

      console.log(db);

      try {
        const modalityEntry = await db.modality.upsert({
          where: { name: role.name, roleId: role.id },
          update: {},
          create: { name: role.name, roleId: role.id },
        });
        logger.success(`Modality '${modalityEntry.name}' ensured in database.`);
      } catch (dbError) {
        logger.error(`Error ensuring modality '${key}' in database:`, dbError);
      }
    }
  );

  /* Cria as separações (categorias) dos canais de voz dos times */
  for (const categoryName of categories) {
    try {
      await CreateChannelCategoryIfNotExistsService({ methods, categoryName });
      logger.success(`Category '${categoryName}' ensured.`);
    } catch (categoryError) {
      logger.error(`Error ensuring category '${categoryName}':`, categoryError);
    }
  }
}
