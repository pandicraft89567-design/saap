const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function rollDice(formula) {
    const match = formula.trim().toLowerCase().match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!match) return null;

    const cantidad  = Math.min(parseInt(match[1]), 20);
    const caras     = Math.min(parseInt(match[2]), 1000);
    const modificador = match[3] ? parseInt(match[3]) : 0;

    if (cantidad < 1 || caras < 2) return null;

    const resultados = [];
    for (let i = 0; i < cantidad; i++) {
        resultados.push(Math.floor(Math.random() * caras) + 1);
    }

    const suma = resultados.reduce((a, b) => a + b, 0) + modificador;
    return { cantidad, caras, modificador, resultados, suma };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dados')
        .setNameLocalizations({ 'en-US': 'dice', 'en-GB': 'dice' })
        .setDescription('Lanza dados al estilo D&D (ej: 2d6, 1d20, 3d8+5)')
        .setDescriptionLocalizations({ 'en-US': 'Roll D&D-style dice (e.g. 2d6, 1d20, 3d8+5)', 'en-GB': 'Roll D&D-style dice (e.g. 2d6, 1d20, 3d8+5)' })
        .addStringOption(opt =>
            opt.setName('formula')
                .setNameLocalizations({ 'en-US': 'formula', 'en-GB': 'formula' })
                .setDescription('Fórmula de dados (ej: 2d6, 1d20, 4d4+2) — máx 20 dados, 1000 caras')
                .setDescriptionLocalizations({ 'en-US': 'Dice formula (e.g. 2d6, 1d20, 4d4+2) — max 20 dice, 1000 sides', 'en-GB': 'Dice formula (e.g. 2d6, 1d20, 4d4+2) — max 20 dice, 1000 sides' })
                .setRequired(true)
                .setMaxLength(20)),

    async execute(interaction) {
        const formula = interaction.options.getString('formula');
        const resultado = rollDice(formula);

        if (!resultado) {
            return await interaction.reply({
                content: '❌ Fórmula inválida. Usa el formato `NdM` o `NdM+B` (ej: `2d6`, `1d20`, `3d8+5`).',
                flags: 64
            });
        }

        const { cantidad, caras, modificador, resultados, suma } = resultado;

        const dados_texto = resultados.map((r, i) => {
            const es_max = r === caras;
            const es_min = r === 1;
            return es_max ? `**[${r}]**` : es_min ? `~~${r}~~` : `${r}`;
        }).join(', ');

        const modificador_texto = modificador !== 0
            ? ` ${modificador > 0 ? '+' : ''}${modificador}`
            : '';

        const embed = new EmbedBuilder()
            .setColor('#C084FC')
            .setTitle(`🎲 Lanzando ${formula.toUpperCase()}`)
            .addFields(
                { name: '🎯 Resultados',   value: dados_texto,                                                      inline: false },
                { name: '➕ Suma base',    value: `${resultados.reduce((a, b) => a + b, 0)}${modificador_texto}`,   inline: true },
                { name: '🏆 Total final',  value: `**${suma}**`,                                                    inline: true }
            )
            .setDescription(
                resultados.length > 1
                    ? `*Negrita = máximo (${caras}) • Tachado = mínimo (1)*`
                    : null
            )
            .setFooter({ text: `Lanzado por ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
