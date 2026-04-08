const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('web')
        .setDescription('Muestra los enlaces oficiales de Soledad ❣'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor('#FF4DA6') // color más vivo
            .setAuthor({ 
                name: 'Soledad ❣', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTitle('<:corazon:1491247139710566471> Enlaces Oficiales')
            .setDescription(
                '<:Corazon:1491246041251582114> **Accede rápidamente a todo lo importante**\n\n' +
                'Usa los botones de abajo para navegar:'
            )
            .addFields(
                { name: '<:web:1490873797098602577> Web', value: 'Sitio oficial del bot', inline: true },
                { name: '<:server:1491249746742870046> Servidor', value: 'Únete a la comunidad', inline: true },
                { name: '<:join:1490873743101136988> Invitar', value: 'Añade el bot a tu servidor', inline: true }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ 
                text: 'Soledad ❣ • Oficial', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Web')
                .setEmoji('<:web:1490873797098602577>')
                .setStyle(ButtonStyle.Link)
                .setURL('https://v0-soledadbot.vercel.app'),

            new ButtonBuilder()
                .setLabel('Servidor')
                .setEmoji('<:server:1491249746742870046>')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/kJtYKPszwS'),

            new ButtonBuilder()
                .setLabel('Añadirme')
                .setEmoji('<:join:1490873743101136988>')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/oauth2/authorize?client_id=766405066860527688&permissions=8&integration_type=0&scope=bot')
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });
    },
};
