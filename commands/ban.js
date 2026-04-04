const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setNameLocalizations({ 'en-US': 'ban', 'en-GB': 'ban' })
        .setDescription('Banea a un usuario del servidor')
        .setDescriptionLocalizations({ 'en-US': 'Ban a user from the server', 'en-GB': 'Ban a user from the server' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario a banear')
                .setDescriptionLocalizations({ 'en-US': 'User to ban', 'en-GB': 'User to ban' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón del baneo')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the ban', 'en-GB': 'Reason for the ban' })
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dias')
                .setNameLocalizations({ 'en-US': 'days', 'en-GB': 'days' })
                .setDescription('Días de mensajes a eliminar (0-7)')
                .setDescriptionLocalizations({ 'en-US': 'Days of messages to delete (0-7)', 'en-GB': 'Days of messages to delete (0-7)' })
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || t('NO_REASON', lang);
        const deleteMessageDays = interaction.options.getInteger('dias') || 0;

        // Verificar permisos del usuario que ejecuta el comando
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: t('NO_PERMISSIONS', lang), flags: 64 });
        }

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: t('BOT_NO_PERMISSIONS', lang), flags: 64 });
        }

        // No puedes banearte a ti mismo
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({ content: t('KILL_SELF', lang), flags: 64 });
        }

        const PROTECTED_USER_ID = '832641595110719509';
        if (targetUser.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (targetUser.id === interaction.client.user.id) {
            return await interaction.reply({ content: t('KILL_BOT', lang), flags: 64 });
        }

        try {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            // Verificar jerarquía de roles
            if (member) {
                if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: t('HIERARCHY_ERROR', lang), flags: 64 });
                }

                if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: t('BOT_HIERARCHY_ERROR', lang), flags: 64 });
                }
            }

            // Ejecutar el baneo
            await interaction.guild.members.ban(targetUser, {
                reason: `${reason} | Moderador: ${interaction.user.username}`,
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('<a:tnt:1385229826008289330> ' + t('BAN_TITLE', lang))
                .setDescription(t('BAN_SUCCESS', lang, { user: targetUser.username }))
                .addFields(
                    { name: t('REASON', lang), value: reason, inline: false },
                    { name: t('MODERATOR', lang), value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error ejecutando baneo:', error);
            if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: t('IA_ERROR', lang), flags: 64 }); } else { await interaction.reply({ content: t('IA_ERROR', lang), flags: 64 }); }
        }
    },
};