const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('silenciar')
        .setNameLocalizations({ 'en-US': 'mute', 'en-GB': 'mute' })
        .setDescription('Silencia a un usuario en canales de texto')
        .setDescriptionLocalizations({ 'en-US': 'Mute a user in text channels', 'en-GB': 'Mute a user in text channels' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario a silenciar')
                .setDescriptionLocalizations({ 'en-US': 'User to mute', 'en-GB': 'User to mute' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duracion')
                .setNameLocalizations({ 'en-US': 'duration', 'en-GB': 'duration' })
                .setDescription('Duración del silencio (ej: 10m, 1h, 1d)')
                .setDescriptionLocalizations({ 'en-US': 'Mute duration (e.g. 10m, 1h, 1d)', 'en-GB': 'Mute duration (e.g. 10m, 1h, 1d)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón del silencio')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the mute', 'en-GB': 'Reason for the mute' })
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal específico (opcional, por defecto todos)')
                .setDescriptionLocalizations({ 'en-US': 'Specific channel (optional, default all)', 'en-GB': 'Specific channel (optional, default all)' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        try {
            const targetUser = interaction.options.getUser('usuario');
            const duration = interaction.options.getString('duracion') || '10m';
            const reason = interaction.options.getString('razon') || t('NO_REASON', lang);
            const member = interaction.guild.members.cache.get(targetUser.id);

            if (!member) return await interaction.reply({ content: t('USER_NOT_FOUND', lang), flags: 64 });

            if (targetUser.id === interaction.user.id) return await interaction.reply({ content: t('KILL_SELF', lang), flags: 64 });

            const PROTECTED_USER_ID = '832641595110719509';
            if (targetUser.id === PROTECTED_USER_ID) {
                return await interaction.reply({
                    content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                    flags: 64
                });
            }

            let durationMs = 600000; // 10m por defecto
            if (duration) {
                const match = duration.match(/^(\d+)(s|m|h|d)$/i);
                if (match) {
                    const value = parseInt(match[1]);
                    const unit = match[2].toLowerCase();
                    if (unit === 's') durationMs = value * 1000;
                    else if (unit === 'm') durationMs = value * 60 * 1000;
                    else if (unit === 'h') durationMs = value * 60 * 60 * 1000;
                    else if (unit === 'd') durationMs = value * 24 * 60 * 60 * 1000;
                }
                // Máximo de Discord: 28 días
                const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000;
                if (durationMs > MAX_TIMEOUT) durationMs = MAX_TIMEOUT;
                if (durationMs < 1000) durationMs = 1000;
            }

            await member.timeout(durationMs, reason);

            const successEmbed = new EmbedBuilder()
                .setColor('#51cf66')
                .setTitle('<a:barrier:1385229854353526828> ' + t('MUTE_TITLE', lang))
                .setDescription(t('MUTE_SUCCESS', lang, { user: targetUser.username }))
                .addFields(
                    { name: t('REASON', lang), value: reason, inline: false },
                    { name: '⏱️ Duración', value: duration || '10m', inline: true },
                    { name: t('MODERATOR', lang), value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error en comando silenciar:', error);
            try {
                await interaction.reply({ content: t('IA_ERROR', lang), flags: 64 });
            } catch (e) {}
        }
    },
};