const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mood')
        .setNameLocalizations({ 'en-US': 'mood', 'en-GB': 'mood' })
        .setDescription('Genera una paleta de colores y un estado de ánimo basado en tu energía actual')
        .setDescriptionLocalizations({ 'en-US': 'Generate a color palette and mood based on your current energy', 'en-GB': 'Generate a color palette and mood based on your current energy' })
        .addStringOption(option =>
            option.setName('energia')
                .setNameLocalizations({ 'en-US': 'energy', 'en-GB': 'energy' })
                .setDescription('¿Cómo te sientes hoy?')
                .setDescriptionLocalizations({ 'en-US': 'How are you feeling today?', 'en-GB': 'How are you feeling today?' })
                .setRequired(true)
                .addChoices(
                    { name: '🔥 Enérgico', value: 'energetic' },
                    { name: '🍃 Relajado', value: 'relaxed' },
                    { name: '🌌 Melancólico', value: 'melancholy' },
                    { name: '✨ Creativo', value: 'creative' },
                    { name: '🌈 Feliz', value: 'happy' }
                )),

    async execute(interaction) {
        const energy = interaction.options.getString('energia');
        
        const moods = {
            energetic: {
                color: '#FF4500',
                title: '🔥 Energía Pura',
                desc: '¡Estás imparable! Tu vibra es vibrante y llena de fuerza.',
                palette: ['#FF4500', '#FFD700', '#FF8C00'],
                advice: 'Aprovecha este impulso para terminar ese proyecto pendiente.'
            },
            relaxed: {
                color: '#87CEEB',
                title: '🍃 Calma Total',
                desc: 'Paz y tranquilidad. Estás en sintonía con el momento.',
                palette: ['#87CEEB', '#E0FFFF', '#B0E0E6'],
                advice: 'Es un buen momento para meditar o leer un libro.'
            },
            melancholy: {
                color: '#483D8B',
                title: '🌌 Introspección Profunda',
                desc: 'Un momento para conectar con tus pensamientos más profundos.',
                palette: ['#483D8B', '#191970', '#6A5ACD'],
                advice: 'Escucha tu música favorita y deja fluir tus emociones.'
            },
            creative: {
                color: '#DA70D6',
                title: '✨ Chispa Creativa',
                desc: 'Tu mente está llena de ideas brillantes y colores.',
                palette: ['#DA70D6', '#FF00FF', '#BA55D3'],
                advice: '¡Dibuja, escribe o crea algo nuevo ahora mismo!'
            },
            happy: {
                color: '#FFD700',
                title: '🌈 Felicidad Radiante',
                desc: '¡Tu alegría es contagiosa! El mundo brilla un poco más contigo.',
                palette: ['#FFD700', '#FFFACD', '#FAFAD2'],
                advice: 'Comparte esa sonrisa con alguien que lo necesite.'
            }
        };

        const selected = moods[energy];
        
        const embed = new EmbedBuilder()
            .setTitle(selected.title)
                .setDescription(`${selected.desc}\n\n**🎨 Tu paleta del día:**\n${selected.palette.join(' • ')}`)
            .setColor(selected.color)
            .addFields(
                { name: '💡 Consejo del bot', value: selected.advice }
            )
            .setThumbnail(`https://singlecolorimage.com/get/${selected.color.replace('#', '')}/400x400`)
            .setFooter({ text: 'Soledad ❣ • Vibra con tu energía' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
