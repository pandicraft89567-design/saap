const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setNameLocalizations({ 'en-US': 'serverinfo', 'en-GB': 'serverinfo' })
        .setDescription('Muestra información detallada del servidor')
        .setDescriptionLocalizations({ 'en-US': 'Show detailed server information', 'en-GB': 'Show detailed server information' }),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);
            const guild = interaction.guild;
            
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle(t('SERVER_INFO_TITLE', lang))
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: t('NAME', lang), value: guild.name, inline: true },
                    { name: '🆔 ID', value: guild.id, inline: true },
                    { name: '👑 Dueño', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Miembros', value: guild.memberCount.toString(), inline: true },
                    { name: '💬 Canales', value: guild.channels.cache.size.toString(), inline: true },
                    { name: '🎭 Roles', value: guild.roles.cache.size.toString(), inline: true },
                    { name: '📅 Creado el', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:f> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: false }
                )
                .setFooter({ text: `Solicitado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando serverinfo:', error);
            const lang = await getLanguage(interaction.guildId);
            await interaction.reply({ content: t('IA_ERROR', lang), flags: 64 });
        }
    },
};