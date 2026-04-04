const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

const FRASES_FALLBACK = {
    motivacional: [
        'Cada día es una nueva oportunidad para ser mejor que ayer.',
        'El único límite real eres tú mismo. Supérate.',
        'No importa cuántas veces caigas, sino cuántas veces te levantas.'
    ],
    filosofica: [
        'La vida no se mide por los momentos que vivimos, sino por los que nos quitan el aliento.',
        'Conocerse a uno mismo es el comienzo de toda sabiduría. — Aristóteles',
        'El hombre que mueve montañas comienza quitando pequeñas piedras.'
    ],
    sarcastica: [
        'Sí, claro, sigue esperando que las cosas cambien solas. Seguro que funciona.',
        'La motivación viene y va. Los hábitos se quedan. Pero bueno, tú elige seguir en el sofá.',
        'El éxito llega a los que madrugan... y a los que tienen buenos contactos, seamos honestos.'
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('frase')
        .setNameLocalizations({ 'en-US': 'quote', 'en-GB': 'quote' })
        .setDescription('Obtén una frase del día')
        .setDescriptionLocalizations({ 'en-US': 'Get a quote of the day', 'en-GB': 'Get a quote of the day' })
        .addStringOption(option =>
            option.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de frase')
                .setDescriptionLocalizations({ 'en-US': 'Quote type', 'en-GB': 'Quote type' })
                .setRequired(false)
                .addChoices(
                    { name: '✨ Motivacional', value: 'motivacional' },
                    { name: '🧠 Filosófica', value: 'filosofica' },
                    { name: '😏 Sarcástica', value: 'sarcastica' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const tipo = interaction.options.getString('tipo') || 'motivacional';

        const tipoTexto = {
            motivacional: 'motivacional e inspiradora',
            filosofica: 'filosófica y profunda, de algún filósofo real o inventada',
            sarcastica: 'sarcástica con toque de humor negro, estilo tsundere'
        }[tipo];

        const prompt = `Eres Soledad, un bot de Discord. Genera UNA frase ${tipoTexto} en español. Máximo 2 oraciones. Sin introducción, solo la frase.`;

        const frase = await generateAIMessage(prompt, 120);
        const fallbacks = FRASES_FALLBACK[tipo];
        const texto = frase || fallbacks[Math.floor(Math.random() * fallbacks.length)];

        const colores = { motivacional: '#FFD700', filosofica: '#9B59B6', sarcastica: '#E74C3C' };
        const titulos = { motivacional: '✨ Frase Motivacional', filosofica: '🧠 Frase Filosófica', sarcastica: '😏 Frase Sarcástica' };

        const embed = new EmbedBuilder()
            .setColor(colores[tipo])
            .setTitle(titulos[tipo])
            .setDescription(`*"${texto}"*`)
            .setFooter({ text: `Solicitado por ${interaction.user.username} • Soledad ❣` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
