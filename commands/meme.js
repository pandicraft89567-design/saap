const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchMeme } = require('../utils/api');
const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, t } = require('../utils/i18n');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setNameLocalizations({ 'en-US': 'meme', 'en-GB': 'meme' })
        .setDescription('Obtén un meme divertido en español')
        .setDescriptionLocalizations({ 'en-US': 'Get a funny meme', 'en-GB': 'Get a funny meme' })
        .addStringOption(option =>
            option.setName('categoria')
                .setNameLocalizations({ 'en-US': 'category', 'en-GB': 'category' })
                .setDescription('Categoría del meme')
                .setDescriptionLocalizations({ 'en-US': 'Meme category', 'en-GB': 'Meme category' })
                .setRequired(false)
                .addChoices(
                    { name: 'Aleatorio', value: 'random' },
                    { name: 'Programación', value: 'ProgrammerHumor' },
                    { name: 'Memes en español', value: 'SpanishMemes' },
                    { name: 'Dank Memes', value: 'dankmemes' }
                )),

    async execute(interaction) {
        console.log(`MEME: Comando recibido de ${interaction.user.tag} - ${new Date().toISOString()}`);
        let lang = 'es';
        try {
            await interaction.deferReply();
            
            lang = await getLanguage(interaction.guildId);
            let categoria = interaction.options.getString('categoria');
            
            // Si no se especifica categoría, elegir basándose en el idioma del servidor
            if (!categoria) {
                categoria = lang === 'es' ? 'SpanishMemes' : 'random';
            }
            
            console.log(`MEME: Obteniendo meme de categoría: ${categoria} (Idioma: ${lang})`);
            
            const memeData = await fetchMeme(categoria);
            console.log(`MEME: Datos obtenidos:`, memeData ? 'Exitoso' : 'Falló');

            if (!memeData) {
                console.log(`MEME: No se pudo obtener meme, enviando error`);
                return await interaction.editReply({
                    embeds: [createErrorEmbed(t('MEME_ERROR', lang))]
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(t('MEME_TITLE', lang))
                .setDescription(memeData.title || 'Meme')
                .setImage(memeData.url)
                .setColor(config.colors.meme)
                .setFooter({ 
                    text: t('MEME_FOOTER', lang, { user: interaction.user.username, category: categoria }),
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Añadir información adicional si está disponible
            if (memeData.author) {
                embed.addFields({ name: '👤 Autor', value: memeData.author, inline: true });
            }
            if (memeData.ups) {
                embed.addFields({ name: '👍 Upvotes', value: memeData.ups.toString(), inline: true });
            }

            await interaction.editReply({ embeds: [embed] });
            console.log(`MEME: Respuesta enviada exitosamente`);

        } catch (error) {
            console.error('MEME ERROR:', error);
            try {
                await interaction.editReply({
                    embeds: [createErrorEmbed(t('MEME_ERROR', lang))]
                });
            } catch (replyError) {
                console.error('MEME: Error enviando respuesta de error:', replyError);
            }
        }
    },
};
