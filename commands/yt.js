const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yt')
        .setNameLocalizations({ 'en-US': 'yt', 'en-GB': 'yt' })
        .setDescription('Busca videos en YouTube')
        .setDescriptionLocalizations({ 'en-US': 'Search videos on YouTube', 'en-GB': 'Search videos on YouTube' })
        .addStringOption(option =>
            option.setName('busqueda')
                .setNameLocalizations({ 'en-US': 'search', 'en-GB': 'search' })
                .setDescription('Términos de búsqueda para YouTube')
                .setDescriptionLocalizations({ 'en-US': 'Search terms for YouTube', 'en-GB': 'Search terms for YouTube' })
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('resultados')
                .setNameLocalizations({ 'en-US': 'results', 'en-GB': 'results' })
                .setDescription('Número de resultados a mostrar (1-5)')
                .setDescriptionLocalizations({ 'en-US': 'Number of results to show (1-5)', 'en-GB': 'Number of results to show (1-5)' })
                .setMinValue(1)
                .setMaxValue(5)
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = await getLanguage(interaction.guildId);

        try {
            const query = interaction.options.getString('busqueda');
            const maxResults = interaction.options.getInteger('resultados') || 3;

            const apiKey = process.env.YOUTUBE_API_KEY;
            
            if (!apiKey) {
                return await interaction.editReply({ content: t('YT_ERROR', lang) });
            }

            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
            const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
            const videos = searchResponse.data.items;
            
            if (!videos || videos.length === 0) {
                return await interaction.editReply({ content: t('YT_ERROR', lang) });
            }

            const resultsEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔍 YouTube')
                .setDescription(`${t('YT_SEARCH', lang)}: **${query}**`)
                .setTimestamp();

            videos.forEach((video, index) => {
                const title = video.snippet.title;
                const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
                resultsEmbed.addFields({ name: `${index + 1}. ${title}`, value: url, inline: false });
            });

            await interaction.editReply({ embeds: [resultsEmbed] });

        } catch (error) {
            console.error('Error en comando yt:', error);
            await interaction.editReply({ content: t('YT_ERROR', lang) });
        }
    },
};