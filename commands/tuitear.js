const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const { generateTweetImage } = require('../utils/tweetImage');

const PROTECTED_USER_ID = '832641595110719509';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tuitear')
        .setNameLocalizations({ 'en-US': 'tweet', 'en-GB': 'tweet' })
        .setDescription('Genera una imagen de tweet estilo X/Twitter 🐦')
        .setDescriptionLocalizations({ 'en-US': 'Generate a tweet-style image (X/Twitter) 🐦', 'en-GB': 'Generate a tweet-style image (X/Twitter) 🐦' })
        .addStringOption(option =>
            option.setName('mensaje')
                .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
                .setDescription('El contenido del tweet (máximo 280 caracteres)')
                .setDescriptionLocalizations({ 'en-US': 'Tweet content (maximum 280 characters)', 'en-GB': 'Tweet content (maximum 280 characters)' })
                .setRequired(true)
                .setMaxLength(280))
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario que "tuitea" (opcional, por defecto tú mismo)')
                .setDescriptionLocalizations({ 'en-US': 'User who "tweets" (optional, default yourself)', 'en-GB': 'User who "tweets" (optional, default yourself)' })
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('foto')
                .setNameLocalizations({ 'en-US': 'photo', 'en-GB': 'photo' })
                .setDescription('Imagen que se mostrará en el tweet (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Image to show in the tweet (optional)', 'en-GB': 'Image to show in the tweet (optional)' })
                .setRequired(false)),

    async execute(interaction) {
        const lang          = await getLanguage(interaction.guildId);
        const tweetContent  = interaction.options.getString('mensaje');
        const mentionedUser = interaction.options.getUser('usuario');
        const attachment    = interaction.options.getAttachment('foto');

        if (mentionedUser?.id === PROTECTED_USER_ID) {
            return interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        const target = mentionedUser || interaction.user;

        await interaction.deferReply();

        try {
            const now       = new Date();
            const timestamp = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
                            + ' · '
                            + now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

            const likes    = Math.floor(Math.random() * 50000)  + 100;
            const retweets = Math.floor(Math.random() * 10000)  + 10;
            const views    = Math.floor(Math.random() * 500000) + 1000;

            const avatarUrl = target.displayAvatarURL({ extension: 'png', size: 128 });

            const imageBuffer = await generateTweetImage({
                displayName: target.displayName || target.username,
                username:    target.username,
                avatarUrl,
                content:     tweetContent,
                likes,
                retweets,
                views,
                timestamp,
                photoUrl:    attachment?.url || null,
            });

            const file = new AttachmentBuilder(imageBuffer, { name: 'tweet.png' });

            await interaction.editReply({ files: [file] });

        } catch (error) {
            console.error('Error en /tuitear:', error);
            await interaction.editReply({ content: t('IA_ERROR', lang) });
        }
    },
};
