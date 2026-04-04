const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desilenciar')
        .setNameLocalizations({ 'en-US': 'unmute', 'en-GB': 'unmute' })
        .setDescription('Quita el silencio (timeout) a un usuario')
        .setDescriptionLocalizations({ 'en-US': 'Remove the mute (timeout) from a user', 'en-GB': 'Remove the mute (timeout) from a user' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que quitar el silencio')
                .setDescriptionLocalizations({ 'en-US': 'User to unmute', 'en-GB': 'User to unmute' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón del dessilencio')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the unmute', 'en-GB': 'Reason for the unmute' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'Sin razón especificada';

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return await interaction.reply({ content: '❌ No tengo permisos para gestionar timeouts.', flags: 64 });
        }

        try {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!member) {
                return await interaction.reply({ content: t('USER_NOT_FOUND', lang), flags: 64 });
            }

            if (!member.communicationDisabledUntil) {
                return await interaction.reply({
                    content: `❌ **${targetUser.username}** no está silenciado actualmente.`,
                    flags: 64
                });
            }

            await member.timeout(null, `${reason} | Moderador: ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🔊 Silencio Removido')
                .setDescription(`**${targetUser.username}** puede hablar de nuevo en el servidor.`)
                .addFields(
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en desilenciar:', error);
            if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: '❌ No pude quitar el silencio.', flags: 64 }); } else { await interaction.reply({ content: '❌ No pude quitar el silencio.', flags: 64 }); }
        }
    },
};
