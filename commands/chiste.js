const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

const CHISTES_FALLBACK = [
    '¿Por qué los pájaros vuelan hacia el sur en invierno? Porque caminar tardaría mucho.',
    '¿Qué le dijo un jardinero a otro? Me alegro de verte.',
    'Un cocodrilo se comió a un abogado. Fue el primer acto de justicia del cocodrilo.',
    '¿Cuándo un pato es fijo? Cuando está remachado.',
    '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
    '¿Por qué los esqueletos no pelean entre sí? Porque no tienen agallas.',
    '¿Cómo se dice pañuelo en japonés? Saka-moko.',
    '¿Qué le dice un semáforo a otro? No me mires que me estoy cambiando.',
    'Ser o no ser... ese es el problema. Pero para los fanáticos del fútbol, el problema es el árbitro.',
    '¿Por qué Drácula no tiene amigos? Porque es un dolor en el cuello.'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broma')
        .setNameLocalizations({ 'en-US': 'joke', 'en-GB': 'joke' })
        .setDescription('Cuéntame una broma o chiste')
        .setDescriptionLocalizations({ 'en-US': 'Tell me a joke', 'en-GB': 'Tell me a joke' })
        .addStringOption(option =>
            option.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de broma')
                .setDescriptionLocalizations({ 'en-US': 'Joke type', 'en-GB': 'Joke type' })
                .setRequired(false)
                .addChoices(
                    { name: '😂 Clásico', value: 'clasico' },
                    { name: '🖤 Oscuro', value: 'negro' },
                    { name: '🤓 Friki', value: 'friki' },
                    { name: '🍕 De papás', value: 'papa' }
                )),

    async execute(interaction) {
        await interaction.deferReply();
        const tipo = interaction.options.getString('tipo') || 'clasico';

        const tipoTexto = {
            clasico: 'gracioso y clásico',
            negro: 'de humor negro (sin ofender grupos reales)',
            friki: 'de cultura friki, anime o videojuegos',
            papa: 'estilo "chiste de papá" (dad joke)'
        }[tipo];

        const prompt = `Eres Soledad, un bot de Discord. Cuéntame UN chiste corto en español, de tipo ${tipoTexto}. Solo el chiste, sin introducción ni explicación. Máximo 3 oraciones.`;

        const chiste = await generateAIMessage(prompt, 150);
        const texto = chiste || CHISTES_FALLBACK[Math.floor(Math.random() * CHISTES_FALLBACK.length)];

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('😂 Chiste del momento')
            .setDescription(texto)
            .setFooter({ text: `Solicitado por ${interaction.user.username} • Tipo: ${tipo}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
