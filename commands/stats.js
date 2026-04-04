const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setNameLocalizations({ 'en-US': 'stats', 'en-GB': 'stats' })
        .setDescription('Muestra las estadísticas del bot')
        .setDescriptionLocalizations({ 'en-US': 'Shows bot statistics', 'en-GB': 'Shows bot statistics' }),
    
    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const client = interaction.client;
        const guildCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        const embed = new EmbedBuilder()
            .setTitle(t('STATS_TITLE', lang))
            .setColor('#3498db')
            .addFields(
                { name: t('GLOBAL_STATS', lang), value: `${t('SERVERS', lang)}: ${guildCount}\n${t('USERS', lang)}: ${userCount}`, inline: true },
                { name: '⚡ Ping', value: `${client.ws.ping}ms`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};