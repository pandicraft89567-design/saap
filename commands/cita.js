const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const { generateQuoteImage, STYLES } = require('../utils/quote');

const CITAS_FALLBACK = [
    { content: 'La vida es lo que pasa mientras estás ocupado haciendo otros planes.', author: 'John Lennon' },
    { content: 'El único modo de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs' },
    { content: 'En medio de la dificultad reside la oportunidad.', author: 'Albert Einstein' },
    { content: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
    { content: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
    { content: 'El futuro pertenece a quienes creen en la belleza de sus sueños.', author: 'Eleanor Roosevelt' },
    { content: 'La imaginación es más importante que el conocimiento.', author: 'Albert Einstein' },
    { content: 'No es la especie más fuerte la que sobrevive, sino la más adaptable.', author: 'Charles Darwin' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cita')
        .setNameLocalizations({ 'en-US': 'quote-card', 'en-GB': 'quote-card' })
        .setDescription('Genera una cita famosa como imagen de tarjeta 💬')
        .setDescriptionLocalizations({ 'en-US': 'Generate a famous quote as a card image 💬', 'en-GB': 'Generate a famous quote as a card image 💬' }),

    async execute(interaction) {
        await interaction.deferReply();

        let cita = null;

        try {
            const res = await axios.get('https://api.quotable.io/random?lang=es', { timeout: 6000 });
            if (res.data?.content) cita = { content: res.data.content, author: res.data.author };
        } catch (_) {}

        if (!cita) {
            try {
                const res = await axios.get('https://zenquotes.io/api/random', { timeout: 6000 });
                if (res.data?.[0]?.q) cita = { content: res.data[0].q, author: res.data[0].a };
            } catch (_) {}
        }

        if (!cita) cita = CITAS_FALLBACK[Math.floor(Math.random() * CITAS_FALLBACK.length)];

        const avatarURL   = interaction.user.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });
        const displayName = interaction.member?.displayName || interaction.user.username;

        const imageBuffer = await generateQuoteImage(
            `"${cita.content}" — ${cita.author}`,
            displayName,
            avatarURL,
            'dark'
        );

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'cita.png' });

        const styleRow = new ActionRowBuilder().addComponents(
            ...Object.entries(STYLES).map(([key, val]) =>
                new ButtonBuilder()
                    .setCustomId(`quote_style:${key}`)
                    .setLabel(val.label)
                    .setStyle(ButtonStyle.Secondary)
            )
        );

        if (!interaction.client.quoteCache) interaction.client.quoteCache = new Map();

        const sent = await interaction.editReply({ files: [attachment], components: [styleRow] });

        interaction.client.quoteCache.set(sent.id, {
            text:      `"${cita.content}" — ${cita.author}`,
            username:  displayName,
            avatarURL,
        });
        setTimeout(() => interaction.client.quoteCache?.delete(sent.id), 10 * 60 * 1000);
    }
};
