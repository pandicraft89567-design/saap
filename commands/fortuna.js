const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const FORTUNAS = [
    'Hoy es un buen día para tomar riesgos calculados. 🎲',
    'Alguien cercano a ti piensa en ti más de lo que crees. 💕',
    'Tu próxima gran oportunidad llegará de donde menos la esperas. ✨',
    'Confía en tu instinto hoy. Raramente te ha fallado. 🌟',
    'Un pequeño acto de amabilidad tuyo cambiará el día de alguien. 🌸',
    'Las estrellas dicen: descansa, recarga, y vuelve más fuerte. 💤',
    'Lo que buscas también te está buscando a ti. 🔮',
    'Hoy podrías encontrar algo valioso donde menos lo esperas. 🍀',
    'Tu paciencia dará frutos muy pronto. No abandones ahora. 🌱',
    'La respuesta que necesitas ya la tienes dentro de ti. 🧠',
    'Alguien a tu alrededor admirará tu valentía hoy. 🦁',
    'Los números de la suerte están de tu lado hoy: **7, 13, 21**. 🎰',
    'Una conversación pendiente abrirá puertas inesperadas. 🚪',
    'No todo tiene que tener sentido ahora. El tiempo revela todo. ⏳',
    'Tu energía de hoy atrae exactamente lo que necesitas. ⚡',
    'El universo conspira en tu favor, aunque no lo veas aún. 🌌',
    'Comparte tu alegría hoy. Se multiplica cuando la das. 😊',
    'Un sueño que tuviste recientemente guarda un mensaje para ti. 💭',
    'La solución a tu problema más grande es más simple de lo que crees. 💡',
    'Hoy cierra ciclos con gracia. Lo nuevo te espera. 🦋',
];

const NUMEROS_SUERTE = () => {
    const nums = new Set();
    while (nums.size < 3) nums.add(Math.floor(Math.random() * 50) + 1);
    return [...nums].join(', ');
};

const COLORES = ['#C084FC', '#F472B6', '#FBBF24', '#4ADE80', '#60A5FA', '#FB923C'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fortuna')
        .setNameLocalizations({ 'en-US': 'fortune', 'en-GB': 'fortune' })
        .setDescription('Obtén tu mensaje de fortuna del día 🔮')
        .setDescriptionLocalizations({ 'en-US': 'Get your fortune message of the day 🔮', 'en-GB': 'Get your fortune message of the day 🔮' }),

    async execute(interaction) {
        const fortuna = FORTUNAS[Math.floor(Math.random() * FORTUNAS.length)];
        const color   = COLORES[Math.floor(Math.random() * COLORES.length)];
        const nums    = NUMEROS_SUERTE();

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🔮 Tu mensaje de fortuna')
            .setDescription(`*"${fortuna}"*`)
            .addFields(
                { name: '🍀 Números de la suerte', value: nums, inline: true },
                { name: '🌈 Color del día',         value: '`' + color + '`', inline: true }
            )
            .setFooter({ text: `Para ${interaction.user.username} • El universo ha hablado` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
