import { InteractionMethods } from "discord/services/interaction-methods.service.js";

export default async function ApagarTimeService(
  methods: ReturnType<typeof InteractionMethods>
) {
  const { getRole, findVoiceChannel, followUp, editReply, deferReply } =
    methods;

  await deferReply();
  const teamRole = getRole("time");

  if (teamRole) {
    try {
      teamRole?.delete(`Apagando time ${teamRole.name}`);
      followUp(`O cargo do time ${teamRole.name} foi apagado`);
    } catch (err) {
      followUp(`Não foi possível apagar o time ${teamRole.name}`);
    }

    const voiceChannel = findVoiceChannel(teamRole.name);

    if (voiceChannel) {
      try {
        voiceChannel.delete(`Apagando canal de voz do time ${teamRole.name}`);
        followUp(`O canal de voz do time ${teamRole.name} foi pagado`);
      } catch (err) {
        followUp(`Não foi possível apagar o time ${teamRole.name}`);
      }
    } else {
      followUp(`O canal de voz do time não foi encontrado para ser apagado.`);
    }

    editReply(`O time ${teamRole.name} foi apagado com sucesso.`);
  } else {
    followUp(`O time não foi encontrado para ser apagado.`);
  }
}
