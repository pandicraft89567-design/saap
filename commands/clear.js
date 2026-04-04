const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setNameLocalizations({ 'en-US': 'clear', 'en-GB': 'clear' })
        .setDescription('Elimina una cantidad específica de mensajes')
        .setDescriptionLocalizations({ 'en-US': 'Delete a specific number of messages', 'en-GB': 'Delete a specific number of messages' })
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
                .setDescription('Número de mensajes a eliminar (1-100)')
                .setDescriptionLocalizations({ 'en-US': 'Number of messages to delete (1-100)', 'en-GB': 'Number of messages to delete (1-100)' })
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const amount = interaction.options.getInteger('cantidad');

        if (!interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ content: t('CLEAR_NO_PERM', lang), flags: 64 });
        }

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(t('CLEAR_SUCCESS', lang, { count: deleted.size }))
                .setFooter({ text: lang === 'es' ? 'Mensajes con más de 14 días no pueden eliminarse en masa.' : 'Messages older than 14 days cannot be bulk deleted.' });

            await interaction.reply({ embeds: [embed], flags: 64 });

        } catch (error) {
            console.error('Error en clear:', error);
            if (error.code === 50034) {
                return await interaction.reply({ content: t('CLEAR_OLD_MSGS', lang), flags: 64 });
            }
            await interaction.reply({ content: t('CLEAR_ERROR', lang), flags: 64 });
        }
    },
};
