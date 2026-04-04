const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purgebot')
        .setNameLocalizations({ 'en-US': 'purgebot', 'en-GB': 'purgebot' })
        .setDescription('Elimina mensajes del bot en el canal actual')
        .setDescriptionLocalizations({ 'en-US': 'Delete bot messages in the current channel', 'en-GB': 'Delete bot messages in the current channel' })
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
                .setDescription('Cantidad de mensajes a revisar (1-100, por defecto 50)')
                .setDescriptionLocalizations({ 'en-US': 'Number of messages to check (1-100, default 50)', 'en-GB': 'Number of messages to check (1-100, default 50)' })
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const cantidad = interaction.options.getInteger('cantidad') || 50;

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ content: '❌ No tengo permisos para eliminar mensajes.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            const mensajes = await interaction.channel.messages.fetch({ limit: cantidad });
            const botMensajes = mensajes.filter(m =>
                m.author.id === interaction.client.user.id &&
                Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
            );

            if (botMensajes.size === 0) {
                return await interaction.editReply({ content: '✅ No encontré mensajes míos recientes en este canal.' });
            }

            const eliminados = await interaction.channel.bulkDelete(botMensajes, true);

            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🧹 Mensajes del Bot Eliminados')
                .setDescription(`Se eliminaron **${eliminados.size}** mensaje${eliminados.size !== 1 ? 's' : ''} míos en ${interaction.channel}.`)
                .setFooter({ text: `Ejecutado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en purgebot:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al eliminar los mensajes.' });
        }
    },
};
