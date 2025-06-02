import { logger } from "#settings";
import { Colors } from "discord.js";
import CreateChannelCategoryIfNotExistsService from "discord/services/create-categoria.service.js";
import CreateRoleCapitaoIfNotExistsService from "discord/services/create-role-capitao.service.js";
import CreateTeamService from "discord/services/create-team.service.js";
import CreateVoiceChannelService from "discord/services/create-voice-channel.service.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import { modalidades } from "utils/modalidades.service.js";

export default async function CriarTimeService(
  methods: ReturnType<typeof InteractionMethods>
) {
  const {
    getString,
    getMember,
    followUp,
    findVoiceChannel,
    member,
    findRoleByName,
  } = methods;

  logger.log(`Começando interação para criar time.`);
  const cargoCapitao = findRoleByName("Capitão");
  if (!cargoCapitao) {
    const errMessage = "Cargo de Capitão não encontrado, criando novo cargo.";
    logger.log(errMessage);
    throw new Error(errMessage);
  }

  const teamName = getString("nome-do-time", required);
  const capitao = getMember("capitao");
  const modalidade = getString("modalidade");
  const teamColor = getString("cor") as keyof typeof Colors;

  if (!teamName) {
    logger.error("Nome do time não informado.");
    throw new Error("Nome do time não informado.");
  }

  const cargoTime = await CreateTeamService({ methods, teamName, teamColor });

  if (!cargoTime) {
    logger.error("Erro ao criar o cargo do time.");
    throw new Error("Houve um erro ao tentar criar o time!");
  }

  if (capitao) {
    try {
      await capitao.roles.add(cargoTime);
      await capitao.roles.add(cargoCapitao);
      const message = `Capitão ${capitao.displayName} adicionado ao cargo "${cargoTime.name}" e ao cargo de Capitão.`;
      await followUp(message);
      logger.log(message);
    } catch (error) {
      const message = `Erro ao adicionar ${capitao.displayName} ao cargo ${cargoTime.name}: ${error}`;
      logger.error(message);
      throw new Error(message);
    }
  }

  if (!capitao || member.id !== capitao.id) {
    try {
      await member.roles.add(cargoCapitao);
      await member.roles.add(cargoTime);

      const message = `Capitão ${member.displayName} adicionado ao cargo "${cargoTime.name}" e ao cargo de Capitão.`;
      await followUp(message);
      logger.log(message);
    } catch (error) {
      const message = `Erro ao adicionar ${member.displayName} como capitão do time ${cargoTime.name}: ${error}`;
      logger.error(message);
      throw new Error(message);
    }
  }

  const categoria = await CreateChannelCategoryIfNotExistsService({
    methods,
    categoryName: `Times de ${modalidade}`,
  });

  try {
    await CreateVoiceChannelService({
      methods,
      channelName: teamName,
      role: cargoTime,
      channelCategory: categoria,
    });
    await followUp(
      `O canal de voz para ${cargoTime.name} foi criado com sucesso!`
    );
  } catch (err) {
    if (cargoTime && findVoiceChannel(cargoTime.name)) {
      await cargoTime.delete("Falha ao criar canal de voz associado.");
    }

    logger.error(
      `Erro ao criar o canal de voz para o time ${cargoTime.name}: ${err}`
    );
    throw new Error(
      `Houve um erro ao criar o canal de voz para o time ${cargoTime.name}, contate um administrador.`
    );
  }
}
