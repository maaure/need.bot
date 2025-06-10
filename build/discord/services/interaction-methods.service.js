import { findMember, findRole } from "@magicyan/discord";
import { ChannelType, PermissionFlagsBits, } from "discord.js";
import MessageStack from "../../utils/message-stack.js";
export function InteractionMethods(interaction) {
    const { guild, member, options } = interaction;
    const messageStack = new MessageStack(interaction);
    function getString(name, required) {
        return options.getString(name, required) ?? undefined;
    }
    function getMember(name) {
        return options.getMember(name);
    }
    function getRole(name) {
        return options.getRole(name);
    }
    function findRoleByName(roleName) {
        if (!roleName)
            return;
        return findRole(guild).byName(roleName);
    }
    function findRoleById(id) {
        if (!id)
            return;
        return findRole(guild).byId(id);
    }
    async function createRoleIfNotExists(opts) {
        let role = findRoleByName(opts.name);
        if (role)
            return role;
        if (!role) {
            role = await createRole(opts);
        }
        return role;
    }
    async function createRole(opts) {
        return await guild.roles.create(opts);
    }
    async function deferReply() {
        return await interaction.deferReply({ ephemeral: true });
    }
    async function followUp(message) {
        return await interaction.followUp({ content: message, flags });
    }
    async function editReply(message) {
        return await interaction.editReply({ content: message });
    }
    async function reply(message) {
        return await interaction.reply({ content: message, flags });
    }
    function findChannelCategory(channelCategoryName) {
        return guild.channels.cache.find((c) => c.name === channelCategoryName && c.type === ChannelType.GuildCategory);
    }
    async function createInvisibleChannelCategory(categoryName) {
        return await guild.channels.create({
            type: ChannelType.GuildCategory,
            name: categoryName,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id, // @everyone
                    deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect], // Ninguém vê ou conecta por padrão
                },
            ],
        });
    }
    function findVoiceChannel(voiceChannelName) {
        return guild.channels.cache.find((c) => c.name === voiceChannelName && c.type === ChannelType.GuildVoice);
    }
    async function createPrivateVoiceChannel(channelName, channelCategory, role) {
        return await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: channelCategory?.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.Connect],
                },
                {
                    id: role.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                        PermissionFlagsBits.Stream,
                    ],
                },
                // Você pode adicionar permissões para administradores aqui se necessário
                // {
                //     id: 'ID_DO_CARGO_ADMINISTRADOR',
                //     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels],
                // },
            ],
            reason: `Canal de voz criado para o time ${role}`,
        });
    }
    function findMemberById(id) {
        return findMember(guild).byId(id);
    }
    return {
        getString,
        getMember,
        getRole,
        findRoleByName,
        createRoleIfNotExists,
        createRole,
        deferReply,
        followUp,
        editReply,
        reply,
        findChannelCategory,
        createInvisibleChannelCategory,
        findVoiceChannel,
        createPrivateVoiceChannel,
        guild,
        member,
        messageStack,
        findMemberById,
        findRoleById,
    };
}
