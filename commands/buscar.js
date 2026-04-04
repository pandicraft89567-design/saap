const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const WIKI_HEADERS = { 'User-Agent': 'SoledadBot/1.0 (Discord bot; contact: admin@soledad.bot)' };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buscar')
        .setNameLocalizations({ 'en-US': 'search', 'en-GB': 'search' })
        .setDescription('Busca información en Wikipedia')
        .setDescriptionLocalizations({ 'en-US': 'Search for information on Wikipedia', 'en-GB': 'Search for information on Wikipedia' })
        .addStringOption(opt =>
            opt.setName('tema')
                .setNameLocalizations({ 'en-US': 'topic', 'en-GB': 'topic' })
                .setDescription('Tema a buscar (ej: Agujero negro, Albert Einstein)')
                .setDescriptionLocalizations({ 'en-US': 'Topic to search (e.g. Black hole, Albert Einstein)', 'en-GB': 'Topic to search (e.g. Black hole, Albert Einstein)' })
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(opt =>
            opt.setName('idioma')
                .setNameLocalizations({ 'en-US': 'language', 'en-GB': 'language' })
                .setDescription('Idioma de la búsqueda')
                .setDescriptionLocalizations({ 'en-US': 'Search language', 'en-GB': 'Search language' })
                .setRequired(false)
                .addChoices(
                    { name: '🇪🇸 Español', value: 'es' },
                    { name: '🇺🇸 English', value: 'en' },
                    { name: '🇫🇷 Français', value: 'fr' },
                    { name: '🇩🇪 Deutsch',  value: 'de' },
                    { name: '🇵🇹 Português', value: 'pt' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const tema   = interaction.options.getString('tema').trim();
        const idioma = interaction.options.getString('idioma') || 'es';
        const base   = `https://${idioma}.wikipedia.org/w/api.php`;

        try {
            // 1. Buscar el artículo
            const searchRes = await axios.get(base, {
                params: {
                    action: 'query', list: 'search',
                    srsearch: tema, srlimit: 1,
                    format: 'json', utf8: 1
                },
                headers: WIKI_HEADERS,
                timeout: 8000
            });

            const resultados = searchRes.data?.query?.search ?? [];
            if (!resultados.length) {
                return interaction.editReply({ content: `❌ No encontré nada sobre **${tema}** en Wikipedia.` });
            }

            const { pageid, title: titulo } = resultados[0];

            // 2. Obtener extracto, imagen y URL
            const extractRes = await axios.get(base, {
                params: {
                    action: 'query', pageids: pageid,
                    prop: 'extracts|pageimages|info',
                    exintro: 1, explaintext: 1,
                    pithumbsize: 400, inprop: 'url',
                    format: 'json', utf8: 1
                },
                headers: WIKI_HEADERS,
                timeout: 8000
            });

            const page     = extractRes.data?.query?.pages?.[pageid];
            if (!page) return interaction.editReply({ content: '❌ No pude obtener la información.' });

            const extracto = page.extract?.trim() || 'Sin descripción disponible.';
            const resumen  = extracto.length > 900 ? extracto.slice(0, 900) + '…' : extracto;
            const imagen   = page.thumbnail?.source ?? null;
            const url      = page.canonicalurl ?? page.fullurl
                          ?? `https://${idioma}.wikipedia.org/?curid=${pageid}`;

            const embed = new EmbedBuilder()
                .setColor('#60A5FA')
                .setTitle(`📖 ${titulo}`)
                .setURL(url)
                .setDescription(resumen)
                .setFooter({ text: `Wikipedia ${idioma.toUpperCase()} • Solicitado por ${interaction.user.username}` })
                .setTimestamp();

            if (imagen) embed.setThumbnail(imagen);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en /buscar:', error.message);
            await interaction.editReply({ content: '❌ No pude realizar la búsqueda. Intenta de nuevo.' });
        }
    }
};
