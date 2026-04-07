const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('web')
        .setDescription('Muestra los enlaces oficiales de Soledad ❣'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('Soledad ❣ — Enlaces Oficiales')
            .setDescription('Haz clic en los botones para visitar nuestra web o añadirme a tu servidor.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: 'Soledad ❣', iconURL: interaction.client.user.displayAvatarURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Web')
                    .setEmoji('<:web:1490873797098602577>')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://v0-soledadbot.vercel.app'),
                new ButtonBuilder()
                    .setLabel('Añadirme')
                    .setEmoji('<:join:1490873743101136988>')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=766405066860527688&permissions=8&integration_type=0&scope=bot')
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
