import { Colors } from "discord.js";
import CreateChannelCategoryIfNotExistsService from "discord/services/create-categoria.service.js";
import CreateRoleCapitaoIfNotExistsService from "discord/services/create-role-capitao.service.js";
import CreateVoiceChannelService from "discord/services/create-voice-channel.service.js";
import { InteractionMethods } from "discord/services/interaction-methods.service.js";
import { modalidades } from "utils/modalidades.service.js";
import { createBrotliCompress } from "zlib";

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
  } = methods;
  const cargoCapitao = await CreateRoleCapitaoIfNotExistsService(methods);

  const nomeTime = getStringOption("nome-do-time", required);
  const capitao = getMemberOption("capitao");
  const modalidade = getStringOption("modalidade");
  const cor = getStringOption("cor") as keyof typeof Colors;

  if (!nomeTime) {
    return;
  }

  const cargoTime = await createRoleIfNotExists({
    name: nomeTime,
    color: cor,
    permissions: [],
    mentionable: true,
  });

  if (!cargoTime) {
    await followUp(
      "Não foi possível criar o cargo do seu time! Por favor, contate um administrador."
    );
    return;
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
      followUp(
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
    const canalVoz = await CreateVoiceChannelService({
      methods,
      channelName: nomeTime,
      role: cargoTime,
      channelCategory: categoria,
    });
    await followUp(
      `O canal de voz para ${cargoTime.name} foi criado com sucesso!`
    );
  } catch (err) {
    await editReply(
      `Houve um erro ao criar o canal de voz para o time ${cargoTime.name}, contate um administrador.`
    );

    if (cargoTime && findVoiceChannel(cargoTime.name)) {
      await cargoTime.delete("Falha ao criar canal de voz associado.");
      await followUp(
        "ℹ️ O cargo do time foi removido devido à falha na criação do canal."
      );
    }
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
  }
}
