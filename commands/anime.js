const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchAnimeGif, fetchAnimeImage } = require('../utils/api');
const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, t } = require('../utils/i18n');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anime')
        .setNameLocalizations({ 'en-US': 'anime', 'en-GB': 'anime' })
        .setDescription('Obtén imágenes o GIFs de anime')
        .setDescriptionLocalizations({ 'en-US': 'Get anime images or GIFs', 'en-GB': 'Get anime images or GIFs' })
        .addStringOption(option =>
            option.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de contenido anime')
                .setDescriptionLocalizations({ 'en-US': 'Anime content type', 'en-GB': 'Anime content type' })
                .setRequired(true)
                .addChoices(
                    { name: '🖼️ Imagen Waifu', value: 'waifu' },
                    { name: '😊 Sonrisa', value: 'smile' },
                    { name: '👋 Saludo', value: 'wave' },
                    { name: '😴 Dormir', value: 'sleepy' },
                    { name: '🎉 Celebrar', value: 'happy' },
                    { name: '😢 Llorar', value: 'cry' },
                    { name: '🤔 Pensar', value: 'think' },
                    { name: '😋 Comer', value: 'nom' }
                ))
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Menciona a un usuario (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Mention a user (optional)', 'en-GB': 'Mention a user (optional)' })
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = await getLanguage(interaction.guildId);

        try {
            const tipo = interaction.options.getString('tipo');
            const mentionedUser = interaction.options.getUser('usuario');
            const author = interaction.user;

            const PROTECTED_USER_ID = '832641595110719509';
            if (mentionedUser && mentionedUser.id === PROTECTED_USER_ID) {
                return await interaction.editReply({
                    content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...'
                });
            }

            let imageUrl;
            let isGif = false;

            // Determinar si es GIF o imagen estática
            const gifTypes = ['smile', 'wave', 'sleepy', 'happy', 'cry', 'think', 'nom'];
            
            if (gifTypes.includes(tipo)) {
                imageUrl = await fetchAnimeGif(tipo);
                isGif = true;
            } else {
                imageUrl = await fetchAnimeImage(tipo);
                isGif = false;
            }

            if (!imageUrl) {
                return await interaction.editReply({
                    embeds: [createErrorEmbed(t('IA_ERROR', lang))]
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(t('ANIME_TITLE', lang))
                .setDescription(`**${author.username}** ${tipo}...`)
                .setImage(imageUrl)
                .setColor(config.colors.anime)
                .setFooter({ 
                    text: t('ANIME_FOOTER', lang, { user: author.username }),
                    iconURL: author.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener contenido de anime:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed(t('IA_ERROR', lang))]
            });
        }
    },
};
