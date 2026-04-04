const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const PREGUNTAS = [
    { pregunta: '¿Cuál es el planeta más grande del sistema solar?', respuestas: ['Júpiter', 'Saturno', 'Neptuno', 'Urano'], correcta: 0 },
    { pregunta: '¿En qué año llegó el hombre a la Luna?', respuestas: ['1969', '1972', '1965', '1971'], correcta: 0 },
    { pregunta: '¿Cuántos elementos tiene la tabla periódica actualmente?', respuestas: ['118', '109', '103', '115'], correcta: 0 },
    { pregunta: '¿Cuál es el océano más grande del mundo?', respuestas: ['Pacífico', 'Atlántico', 'Índico', 'Ártico'], correcta: 0 },
    { pregunta: '¿En qué país se inventó el papel?', respuestas: ['China', 'Egipto', 'Japón', 'India'], correcta: 0 },
    { pregunta: '¿Cuántos huesos tiene el cuerpo humano adulto?', respuestas: ['206', '212', '198', '220'], correcta: 0 },
    { pregunta: '¿Cuál es la capital de Australia?', respuestas: ['Canberra', 'Sídney', 'Melbourne', 'Brisbane'], correcta: 0 },
    { pregunta: '¿Quién pintó la Mona Lisa?', respuestas: ['Leonardo da Vinci', 'Miguel Ángel', 'Rafael', 'Botticelli'], correcta: 0 },
    { pregunta: '¿Cuál es el metal más abundante en la corteza terrestre?', respuestas: ['Aluminio', 'Hierro', 'Calcio', 'Silicio'], correcta: 0 },
    { pregunta: '¿Cuántas cuerdas tiene una guitarra estándar?', respuestas: ['6', '4', '8', '12'], correcta: 0 },
    { pregunta: '¿En qué continente está Marruecos?', respuestas: ['África', 'Asia', 'Europa', 'Oriente Medio'], correcta: 0 },
    { pregunta: '¿Cuál es el animal terrestre más rápido?', respuestas: ['Guepardo', 'León', 'Caballo', 'Springbok'], correcta: 0 },
    { pregunta: '¿Quién escribió "Cien años de soledad"?', respuestas: ['Gabriel García Márquez', 'Mario Vargas Llosa', 'Jorge Luis Borges', 'Pablo Neruda'], correcta: 0 },
    { pregunta: '¿Cuál es el país más grande del mundo por superficie?', respuestas: ['Rusia', 'Canadá', 'China', 'Estados Unidos'], correcta: 0 },
    { pregunta: '¿Cuántos lados tiene un hexágono?', respuestas: ['6', '5', '7', '8'], correcta: 0 },
];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setNameLocalizations({ 'en-US': 'trivia', 'en-GB': 'trivia' })
        .setDescription('Responde una pregunta de trivia aleatoria')
        .setDescriptionLocalizations({ 'en-US': 'Answer a random trivia question', 'en-GB': 'Answer a random trivia question' }),

    async execute(interaction) {
        const base = PREGUNTAS[Math.floor(Math.random() * PREGUNTAS.length)];
        const correctaTexto = base.respuestas[base.correcta];

        const mezcladas = shuffle(base.respuestas);
        const nuevaCorrecta = mezcladas.indexOf(correctaTexto);

        const letras = ['A', 'B', 'C', 'D'];
        const botonesRow = new ActionRowBuilder().addComponents(
            mezcladas.map((r, i) =>
                new ButtonBuilder()
                    .setCustomId(`trivia_${i === nuevaCorrecta ? 'correct' : 'wrong'}_${i}_${interaction.id}`)
                    .setLabel(`${letras[i]}: ${r}`)
                    .setStyle(ButtonStyle.Primary)
            )
        );

        const embed = new EmbedBuilder()
            .setColor('#F4C430')
            .setTitle('🧠 Trivia')
            .setDescription(`**${base.pregunta}**`)
            .setFooter({ text: 'Tienes 20 segundos para responder • Soledad ❣' })
            .setTimestamp();

        const msg = await interaction.reply({ embeds: [embed], components: [botonesRow], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 20000 });

        collector.on('collect', async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({ content: '¡Esta trivia no es tuya! Usa `/trivia` para la tuya propia.', flags: 64 });
            }

            const acerto = btn.customId.includes('correct');

            const resultEmbed = new EmbedBuilder()
                .setColor(acerto ? '#2ECC71' : '#E74C3C')
                .setTitle(acerto ? '✅ ¡Correcto!' : '❌ ¡Incorrecto!')
                .setDescription(`**${base.pregunta}**\n\n${acerto ? '¡Eso es!' : `La respuesta correcta era: **${correctaTexto}**`}`)
                .setFooter({ text: `Respondido por ${btn.user.username}` })
                .setTimestamp();

            await btn.update({ embeds: [resultEmbed], components: [] });
            collector.stop();
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('⏰ ¡Tiempo!')
                    .setDescription(`**${base.pregunta}**\n\nSe acabó el tiempo. La respuesta correcta era: **${correctaTexto}**`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    },
};
