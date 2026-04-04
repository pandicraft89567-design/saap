const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setNameLocalizations({ 'en-US': '8ball', 'en-GB': '8ball' })
        .setDescription('Pregunta algo a la bola mágica de cristal')
        .setDescriptionLocalizations({ 'en-US': 'Ask the magic crystal ball something', 'en-GB': 'Ask the magic crystal ball something' })
        .addStringOption(option =>
            option.setName('pregunta')
                .setNameLocalizations({ 'en-US': 'question', 'en-GB': 'question' })
                .setDescription('Tu pregunta para el destino')
                .setDescriptionLocalizations({ 'en-US': 'Your question for destiny', 'en-GB': 'Your question for destiny' })
                .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('pregunta');
        await interaction.deferReply();

        const fallbackResponses = [
            'En mi opinión, sí.',
            'Es cierto.',
            'Es decididamente así.',
            'Probablemente.',
            'Buen pronóstico.',
            'Todo apunta a que sí.',
            'Sin duda.',
            'Sí.',
            'Sí, definitivamente.',
            'Debes confiar en ello.',
            'Respuesta vaga, intenta otra vez.',
            'Pregunta en otro momento.',
            'Será mejor que no te lo diga ahora.',
            'No puedo predecirlo ahora.',
            'Concéntrate y pregunta otra vez.',
            'No cuentes con ello.',
            'Mi respuesta es no.',
            'Mis fuentes dicen que no.',
            'Las perspectivas no son buenas.',
            'Muy dudoso.'
        ];

        const prompt = `Eres la bola mágica de cristal 🔮 de un bot de Discord llamado Soledad. Alguien preguntó: "${question}". Da una respuesta mística, creativa e inesperada en español (máximo 1 oración corta). Puede ser positiva, negativa, misteriosa o filosófica. Sin emojis.`;

        const aiResponse = await generateAIMessage(prompt, 60);
        const response = aiResponse || fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        const embed = new EmbedBuilder()
            .setTitle('🔮 La Bola Mágica')
            .setColor('#4B0082')
            .addFields(
                { name: '❓ Tu Pregunta', value: question },
                { name: '✨ Mi Respuesta', value: response }
            )
            .setThumbnail('https://i.imgur.com/vHqY7R7.png')
            .setFooter({ text: 'Soledad ❣ • El destino está escrito' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
