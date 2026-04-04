const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const OPCIONES = ['piedra', 'papel', 'tijera'];

const EMOJIS = { piedra: '🪨', papel: '📄', tijera: '✂️' };

function getResultado(jugador, bot) {
    if (jugador === bot) return 'empate';
    if (
        (jugador === 'piedra' && bot === 'tijera') ||
        (jugador === 'papel' && bot === 'piedra') ||
        (jugador === 'tijera' && bot === 'papel')
    ) return 'gana';
    return 'pierde';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setNameLocalizations({ 'en-US': 'rps', 'en-GB': 'rps' })
        .setDescription('Juega piedra, papel o tijera contra el bot')
        .setDescriptionLocalizations({ 'en-US': 'Play rock, paper, scissors against the bot', 'en-GB': 'Play rock, paper, scissors against the bot' })
        .addStringOption(option =>
            option.setName('eleccion')
                .setNameLocalizations({ 'en-US': 'choice', 'en-GB': 'choice' })
                .setDescription('Tu elección')
                .setDescriptionLocalizations({ 'en-US': 'Your choice', 'en-GB': 'Your choice' })
                .setRequired(true)
                .addChoices(
                    { name: '🪨 Piedra', value: 'piedra' },
                    { name: '📄 Papel', value: 'papel' },
                    { name: '✂️ Tijera', value: 'tijera' }
                )),

    async execute(interaction) {
        const eleccionJugador = interaction.options.getString('eleccion');
        const eleccionBot = OPCIONES[Math.floor(Math.random() * 3)];
        const resultado = getResultado(eleccionJugador, eleccionBot);

        const colores = { gana: '#2ECC71', pierde: '#E74C3C', empate: '#F4C430' };
        const titulos = {
            gana: '🏆 ¡Ganaste!',
            pierde: '💀 ¡Perdiste!',
            empate: '🤝 ¡Empate!'
        };
        const frases = {
            gana: '¡Qué suerte tienes... o habilidad! Supongo.',
            pierde: 'Jajaja, predecible. Inténtalo de nuevo.',
            empate: 'Hm, pensamos igual. Qué raro.'
        };

        const embed = new EmbedBuilder()
            .setColor(colores[resultado])
            .setTitle(titulos[resultado])
            .addFields(
                { name: `${interaction.user.username}`, value: `${EMOJIS[eleccionJugador]} **${eleccionJugador}**`, inline: true },
                { name: 'VS', value: '⚔️', inline: true },
                { name: 'Soledad ❣', value: `${EMOJIS[eleccionBot]} **${eleccionBot}**`, inline: true }
            )
            .setDescription(`*"${frases[resultado]}"*`)
            .setFooter({ text: 'Soledad ❣ • Piedra Papel Tijera' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
