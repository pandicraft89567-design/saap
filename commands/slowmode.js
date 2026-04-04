const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setNameLocalizations({ 'en-US': 'slowmode', 'en-GB': 'slowmode' })
        .setDescription('Establece el modo lento en el canal actual')
        .setDescriptionLocalizations({ 'en-US': 'Set slow mode in the current channel', 'en-GB': 'Set slow mode in the current channel' })
        .addIntegerOption(option => 
            option.setName('segundos')
                .setNameLocalizations({ 'en-US': 'seconds', 'en-GB': 'seconds' })
                .setDescription('Segundos de espera (0 para desactivar)')
                .setDescriptionLocalizations({ 'en-US': 'Wait time in seconds (0 to disable)', 'en-GB': 'Wait time in seconds (0 to disable)' })
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);

        if (!interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ content: t('SLOWMODE_NO_PERM', lang), flags: 64 });
        }

        const seconds = interaction.options.getInteger('segundos');
        
        try {
            await interaction.channel.setRateLimitPerUser(seconds);
            
            const embed = new EmbedBuilder()
                .setTitle(t('SLOWMODE_TITLE', lang))
                .setDescription(seconds === 0 ? t('SLOWMODE_OFF', lang) : t('SLOWMODE_ON', lang, { seconds }))
                .setColor(seconds === 0 ? '#43B581' : '#FAA61A')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            return interaction.reply({ content: t('SLOWMODE_ERROR', lang), flags: 64 });
        }
    },
};
