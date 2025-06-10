export default async function CreateVoiceChannelService({ methods, channelName, channelCategory, role, }) {
    let canalVoz = methods.findVoiceChannel(channelName);
    if (canalVoz) {
        await methods.editReply(`⚠️ Um canal de voz chamado "${channelName}" já existe. Verifique se é o seu.`);
        return;
    }
    return await methods.createPrivateVoiceChannel(channelName, channelCategory, role);
}
