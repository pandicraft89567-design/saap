const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dado')
        .setNameLocalizations({ 'en-US': 'die', 'en-GB': 'die' })
        .setDescription('Tira un dado y obtén un número aleatorio')
        .setDescriptionLocalizations({ 'en-US': 'Roll a die and get a random number', 'en-GB': 'Roll a die and get a random number' })
        .addIntegerOption(option =>
            option.setName('lados')
                .setNameLocalizations({ 'en-US': 'sides', 'en-GB': 'sides' })
                .setDescription('Número de lados del dado (por defecto 6)')
                .setDescriptionLocalizations({ 'en-US': 'Number of sides on the die (default 6)', 'en-GB': 'Number of sides on the die (default 6)' })
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
                .setDescription('Cuántos dados tirar (1-10)')
                .setDescriptionLocalizations({ 'en-US': 'How many dice to roll (1-10)', 'en-GB': 'How many dice to roll (1-10)' })
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)),

    async execute(interaction) {
        const lados = interaction.options.getInteger('lados') || 6;
        const cantidad = interaction.options.getInteger('cantidad') || 1;

        const resultados = [];
        for (let i = 0; i < cantidad; i++) {
            resultados.push(Math.floor(Math.random() * lados) + 1);
        }

        const total = resultados.reduce((a, b) => a + b, 0);
        const resultadoTexto = cantidad > 1
            ? resultados.map((r, i) => `Dado ${i + 1}: **${r}**`).join('\n')
            : `**${resultados[0]}**`;

        const embed = new EmbedBuilder()
            .setColor('#F4C430')
            .setTitle(`🎲 Dado${cantidad > 1 ? 's' : ''} D${lados}`)
            .setDescription(resultadoTexto)
            .setFooter({ text: `${interaction.user.username} tiró ${cantidad} dado${cantidad > 1 ? 's' : ''} de ${lados} caras${cantidad > 1 ? ` • Total: ${total}` : ''}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
