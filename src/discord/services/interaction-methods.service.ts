import { findMember, findRole } from "@magicyan/discord";
import {
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  Role,
  RoleCreateOptions,
} from "discord.js";
import MessageStack from "../../utils/message-stack.js";

export type InteractionMethodsType = ReturnType<typeof InteractionMethods>;

export function InteractionMethods(
  interaction: ChatInputCommandInteraction<"cached">
) {
  const { guild, member, options } = interaction;
  const messageStack = new MessageStack(interaction);
  function getString(name: string, required?: boolean) {
    return options.getString(name, required) ?? undefined;
  }

  function getMember(name: string) {
    return options.getMember(name);
  }

  function getRole(name: string) {
    return options.getRole(name);
  }

  function findRoleByName(roleName?: string) {
    if (!roleName) return;
    return findRole(guild).byName(roleName);
  }
  function findRoleById(id?: string) {
    if (!id) return;
    return findRole(guild).byId(id);
  }

  async function createRoleIfNotExists(opts: RoleCreateOptions) {
    let role = findRoleByName(opts.name);
    if (role) return role;
    if (!role) {
      role = await createRole(opts);
    }
    return role;
  }

  async function createRole(opts: RoleCreateOptions) {
    return await guild.roles.create(opts);
  }

  async function deferReply() {
    return await interaction.deferReply({ ephemeral: true });
  }

  async function followUp(message: string) {
    return await interaction.followUp({ content: message, flags });
  }

  async function editReply(message: string) {
    return await interaction.editReply({ content: message });
  }

  async function reply(message: string) {
    return await interaction.reply({ content: message, flags });
  }

  function findChannelCategory(channelCategoryName: string) {
    return guild.channels.cache.find(
      (c) =>
        c.name === channelCategoryName && c.type === ChannelType.GuildCategory
    ) as CategoryChannel | undefined;
  }

  async function createInvisibleChannelCategory(categoryName: string) {
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

  function findVoiceChannel(voiceChannelName: string) {
    return guild.channels.cache.find(
      (c) => c.name === voiceChannelName && c.type === ChannelType.GuildVoice
    );
  }

  async function createPrivateVoiceChannel(
    channelName: string,
    channelCategory: CategoryChannel,
    role: Role
  ) {
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

  function findMemberById(id: string) {
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
