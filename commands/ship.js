const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const PROTECTED_USER_ID = '832641595110719509';

function getShipEmoji(percent) {
    if (percent >= 90) return '💍 ¡Almas gemelas!';
    if (percent >= 75) return '💕 ¡Gran compatibilidad!';
    if (percent >= 60) return '😊 Buena vibra';
    if (percent >= 40) return '🤔 Puede funcionar...';
    if (percent >= 20) return '😬 Un poco forzado';
    return '💔 No están hechos el uno para el otro';
}

function getProgressBar(percent) {
    const filled = Math.round(percent / 10);
    return '❤️'.repeat(filled) + '🖤'.repeat(10 - filled);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setNameLocalizations({ 'en-US': 'ship', 'en-GB': 'ship' })
        .setDescription('Calcula la compatibilidad amorosa entre dos personas')
        .setDescriptionLocalizations({ 'en-US': 'Calculate the romantic compatibility between two people', 'en-GB': 'Calculate the romantic compatibility between two people' })
        .addUserOption(option =>
            option.setName('persona1')
                .setNameLocalizations({ 'en-US': 'person1', 'en-GB': 'person1' })
                .setDescription('Primera persona')
                .setDescriptionLocalizations({ 'en-US': 'First person', 'en-GB': 'First person' })
                .setRequired(true))
        .addUserOption(option =>
            option.setName('persona2')
                .setNameLocalizations({ 'en-US': 'person2', 'en-GB': 'person2' })
                .setDescription('Segunda persona')
                .setDescriptionLocalizations({ 'en-US': 'Second person', 'en-GB': 'Second person' })
                .setRequired(true)),

    async execute(interaction) {
        const p1 = interaction.options.getUser('persona1');
        const p2 = interaction.options.getUser('persona2');

        if (p1.id === PROTECTED_USER_ID || p2.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (p1.id === p2.id) {
            return await interaction.reply({
                content: '🤨 No puedes hacer ship contigo mismo... o sí, no te juzgo.',
                flags: 64
            });
        }

        const seed = [...(p1.id + p2.id)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const percent = seed % 101;

        const shipName = p1.username.slice(0, Math.ceil(p1.username.length / 2)) +
            p2.username.slice(Math.floor(p2.username.length / 2));

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`<:kokoro:1385223047207850024> Ship: ${shipName}`)
            .setDescription(`**${p1.username}** + **${p2.username}**`)
            .addFields(
                { name: '💞 Compatibilidad', value: `${getProgressBar(percent)} **${percent}%**`, inline: false },
                { name: '✨ Veredicto', value: getShipEmoji(percent), inline: false }
            )
            .setThumbnail(p1.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Pedido por ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
