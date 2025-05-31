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
    getStringOption,
    getMemberOption,
    createRoleIfNotExists,
    followUp,
    editReply,
    findVoiceChannel,
    member,
    deferReply,
  } = methods;

  deferReply();

  const cargoCapitao = await CreateRoleCapitaoIfNotExistsService(methods);

  const teamName = getStringOption("nome-do-time", required);
  const capitao = getMemberOption("capitao");
  const modalidade = getStringOption("modalidade");
  const teamColor = getStringOption("cor") as keyof typeof Colors;

  if (!teamName) {
    await editReply("Nome do time não informado!");
    return;
  }

  const cargoTime = await CreateTeamService({ methods, teamName, teamColor });

  if (!cargoTime) {
    await editReply("Houve um erro ao tentar criar o time!");
  }

  if (capitao) {
    try {
      await capitao.roles.add(cargoTime);
      await capitao.roles.add(cargoCapitao);
      await followUp(
        `✅ ${capitao.displayName} adicionado ao cargo "${cargoTime.name}".`
      );
    } catch (error) {
      console.error(`Erro ao adicionar capitão ao cargo: ${error}`);
      editReply(
        `⚠️ Não foi possível adicionar ${capitao.displayName} ao cargo. Verifique as permissões do bot.`
      );
    }
  }

  if (!capitao || member.id !== capitao.id) {
    try {
      await member.roles.add(cargoCapitao);
      await followUp(
        `✅ ${member.displayName} foi adicionado como capitão do time ${cargoTime.name}.`
      );
    } catch (error) {
      console.error(
        `Erro ao adicionar ${member.id} como capitão do time ${cargoTime.name}`
      );
      followUp(
        `Erro ao adicionar ${member.id} como capitão do time ${cargoTime.name}`
      );
    }
  }

  const categoria = await CreateChannelCategoryIfNotExistsService({
    methods,
    categoryName: `Times - ${modalidade}`,
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

    throw Error(
      `Houve um erro ao criar o canal de voz para o time ${cargoTime.name}, contate um administrador.`
    );
  }

  //TODO adicionar mensagens para quando cargos já existirem e quando nao existirem
  if (modalidade) {
    let cargoModalidade = await createRoleIfNotExists({
      name: modalidade,
      color: modalidades[modalidade as keyof typeof modalidades].cor,
      permissions: [],
      mentionable: true,
    });

    await member.roles.add(cargoModalidade);
  } else {
    throw Error(`Não foi possível criar a modalidade de jogo ${modalidade}.`);
  }
}
