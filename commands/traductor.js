const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const IDIOMAS = {
    es: '🇪🇸 Español',  en: '🇺🇸 Inglés',   pt: '🇵🇹 Portugués',
    fr: '🇫🇷 Francés',  de: '🇩🇪 Alemán',    it: '🇮🇹 Italiano',
    ja: '🇯🇵 Japonés',  ko: '🇰🇷 Coreano',   zh: '🇨🇳 Chino',
    ru: '🇷🇺 Ruso',     ar: '🇸🇦 Árabe',     nl: '🇳🇱 Holandés'
};

const CHOICES = Object.entries(IDIOMAS).map(([value, name]) => ({ name, value }));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('traductor')
        .setNameLocalizations({ 'en-US': 'translator', 'en-GB': 'translator' })
        .setDescription('Traduce texto a cualquier idioma 🌐')
        .setDescriptionLocalizations({ 'en-US': 'Translate text to any language 🌐', 'en-GB': 'Translate text to any language 🌐' })
        .addStringOption(opt =>
            opt.setName('texto')
                .setNameLocalizations({ 'en-US': 'text', 'en-GB': 'text' })
                .setDescription('Texto que quieres traducir')
                .setDescriptionLocalizations({ 'en-US': 'Text you want to translate', 'en-GB': 'Text you want to translate' })
                .setRequired(true)
                .setMaxLength(500))
        .addStringOption(opt =>
            opt.setName('a')
                .setNameLocalizations({ 'en-US': 'to', 'en-GB': 'to' })
                .setDescription('Idioma de destino')
                .setDescriptionLocalizations({ 'en-US': 'Target language', 'en-GB': 'Target language' })
                .setRequired(true)
                .addChoices(...CHOICES))
        .addStringOption(opt =>
            opt.setName('de')
                .setNameLocalizations({ 'en-US': 'from', 'en-GB': 'from' })
                .setDescription('Idioma de origen (por defecto: detección automática)')
                .setDescriptionLocalizations({ 'en-US': 'Source language (default: auto-detect)', 'en-GB': 'Source language (default: auto-detect)' })
                .setRequired(false)
                .addChoices(...CHOICES)),

    async execute(interaction) {
        await interaction.deferReply();

        const texto    = interaction.options.getString('texto').trim();
        const destino  = interaction.options.getString('a');
        const origen   = interaction.options.getString('de') || 'autodetect';
        const langpair = `${origen}|${destino}`;

        try {
            const res = await axios.get('https://api.mymemory.translated.net/get', {
                params: { q: texto, langpair },
                timeout: 8000
            });

            const data       = res.data;
            const traduccion = data?.responseData?.translatedText;
            const status     = data?.responseStatus;

            if (!traduccion || status !== 200) {
                return interaction.editReply({ content: '❌ No pude traducir el texto. Intenta con otro idioma.' });
            }

            const origenLabel  = origen === 'autodetect' ? '🔍 Auto' : (IDIOMAS[origen] ?? origen);
            const destinoLabel = IDIOMAS[destino] ?? destino;

            const embed = new EmbedBuilder()
                .setColor('#34D399')
                .setTitle('🌐 Traductor')
                .addFields(
                    { name: `${origenLabel} — Original`,   value: `> ${texto}`,       inline: false },
                    { name: `${destinoLabel} — Traducción`, value: `> ${traduccion}`,  inline: false }
                )
                .setFooter({ text: `MyMemory API • Solicitado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en /traductor:', error.message);
            await interaction.editReply({ content: '❌ Error al conectar con el servicio de traducción. Intenta más tarde.' });
        }
    }
};
