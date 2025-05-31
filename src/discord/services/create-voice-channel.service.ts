import { InteractionMethods } from "./interaction-methods.service.js";
import { CategoryChannel, Role } from "discord.js";

interface CreateVoiceChannelServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
  channelName: string;
  channelCategory: CategoryChannel;
  role: Role;
}

export default async function CreateVoiceChannelService({
  methods,
  channelName,
  channelCategory,
  role,
}: CreateVoiceChannelServiceParams) {
  let canalVoz = methods.findVoiceChannel(channelName);

  if (canalVoz) {
    await methods.editReply(
      `⚠️ Um canal de voz chamado "${channelName}" já existe. Verifique se é o seu.`
    );
    return;
  }

  return await methods.createPrivateVoiceChannel(
    channelName,
    channelCategory,
    role
  );
}
