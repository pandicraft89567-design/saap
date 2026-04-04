const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

const VERDADES = [
    '¿Cuál es tu mayor miedo que nunca le has contado a nadie?',
    '¿Alguna vez has mentido para salir de una situación incómoda en este servidor?',
    '¿Cuál fue la última mentira piadosa que dijiste?',
    '¿A quién de este servidor admiras en secreto?',
    '¿Cuál es tu canción favorita pero que te da vergüenza admitir?',
    '¿Has hecho stalking a alguien en redes sociales? ¿A quién?',
    '¿Cuál es el regalo más raro que has recibido?',
    '¿Tienes algún talento oculto que nadie conoce?',
];

const RETOS = [
    'Escribe un poema de 4 versos dedicado a alguien del servidor.',
    'Imita a algún miembro del servidor en tu próximo mensaje.',
    'Escribe el alfabeto usando solo emojis.',
    'Invéntate un trabalenguas y escríbelo aquí.',
    'Escribe un mensaje completamente en mayúsculas durante los próximos 5 minutos.',
    'Cambia tu apodo por algo gracioso durante 10 minutos.',
    'Cuenta hasta 20 en otro idioma.',
    'Escribe una canción de cuna para el servidor.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verdadoreto')
        .setNameLocalizations({ 'en-US': 'truthordare', 'en-GB': 'truthordare' })
        .setDescription('Obtén una verdad o un reto aleatorio')
        .setDescriptionLocalizations({ 'en-US': 'Get a random truth or dare', 'en-GB': 'Get a random truth or dare' })
        .addStringOption(option =>
            option.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('¿Verdad, reto o aleatorio?')
                .setDescriptionLocalizations({ 'en-US': 'Truth, dare or random?', 'en-GB': 'Truth, dare or random?' })
                .setRequired(false)
                .addChoices(
                    { name: '🤔 Verdad', value: 'verdad' },
                    { name: '💪 Reto', value: 'reto' },
                    { name: '🎲 Aleatorio', value: 'aleatorio' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        let tipo = interaction.options.getString('tipo') || 'aleatorio';
        if (tipo === 'aleatorio') tipo = Math.random() < 0.5 ? 'verdad' : 'reto';

        const esVerdad = tipo === 'verdad';

        const prompt = esVerdad
            ? 'Eres Soledad, un bot de Discord divertido. Genera UNA pregunta de "verdad" creativa para un juego de verdad o reto en español. Que sea personal pero no demasiado íntima. Sin introducción.'
            : 'Eres Soledad, un bot de Discord divertido. Genera UN reto creativo y gracioso para un juego de verdad o reto en Discord. Que sea posible hacer en el chat. Sin introducción.';

        const aiTexto = await generateAIMessage(prompt, 120);

        const fallback = esVerdad
            ? VERDADES[Math.floor(Math.random() * VERDADES.length)]
            : RETOS[Math.floor(Math.random() * RETOS.length)];

        const texto = aiTexto || fallback;

        const embed = new EmbedBuilder()
            .setColor(esVerdad ? '#7289DA' : '#FF6B6B')
            .setTitle(esVerdad ? '🤔 VERDAD' : '💪 RETO')
            .setDescription(`**${texto}**`)
            .setFooter({ text: `Para ${interaction.user.username} • ¡Tienes que hacerlo!` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
