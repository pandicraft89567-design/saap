const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setNameLocalizations({ 'en-US': 'avatar', 'en-GB': 'avatar' })
        .setDescription('Muestra el avatar de un usuario')
        .setDescriptionLocalizations({ 'en-US': "Show a user's avatar", 'en-GB': "Show a user's avatar" })
        .addUserOption(option => 
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('El usuario del que quieres ver el avatar')
                .setDescriptionLocalizations({ 'en-US': 'The user whose avatar you want to see', 'en-GB': 'The user whose avatar you want to see' })
                .setRequired(false)),
    
    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const user = interaction.options.getUser('usuario') || interaction.user;
        
        const embed = new EmbedBuilder()
            .setTitle(t('AVATAR_TITLE', lang, { user: user.username }))
            .setImage(user.displayAvatarURL({ size: 1024 }))
            .setColor('#ff6b9d');
        
        await interaction.reply({ embeds: [embed] });
    }
};