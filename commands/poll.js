const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setNameLocalizations({ 'en-US': 'poll', 'en-GB': 'poll' })
        .setDescription('Crea una encuesta con opciones')
        .setDescriptionLocalizations({ 'en-US': 'Create a poll with options', 'en-GB': 'Create a poll with options' })
        .addStringOption(option =>
            option.setName('pregunta')
                .setNameLocalizations({ 'en-US': 'question', 'en-GB': 'question' })
                .setDescription('La pregunta de la encuesta')
                .setDescriptionLocalizations({ 'en-US': 'The poll question', 'en-GB': 'The poll question' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion1')
                .setNameLocalizations({ 'en-US': 'option1', 'en-GB': 'option1' })
                .setDescription('Primera opción')
                .setDescriptionLocalizations({ 'en-US': 'First option', 'en-GB': 'First option' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion2')
                .setNameLocalizations({ 'en-US': 'option2', 'en-GB': 'option2' })
                .setDescription('Segunda opción')
                .setDescriptionLocalizations({ 'en-US': 'Second option', 'en-GB': 'Second option' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion3')
                .setNameLocalizations({ 'en-US': 'option3', 'en-GB': 'option3' })
                .setDescription('Tercera opción (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Third option (optional)', 'en-GB': 'Third option (optional)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('opcion4')
                .setNameLocalizations({ 'en-US': 'option4', 'en-GB': 'option4' })
                .setDescription('Cuarta opción (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Fourth option (optional)', 'en-GB': 'Fourth option (optional)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('opcion5')
                .setNameLocalizations({ 'en-US': 'option5', 'en-GB': 'option5' })
                .setDescription('Quinta opción (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Fifth option (optional)', 'en-GB': 'Fifth option (optional)' })
                .setRequired(false)),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);
            const question = interaction.options.getString('pregunta');
            const options = [
                interaction.options.getString('opcion1'),
                interaction.options.getString('opcion2'),
                interaction.options.getString('opcion3'),
                interaction.options.getString('opcion4'),
                interaction.options.getString('opcion5')
            ].filter(option => option !== null);

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            const description = options.map((option, index) => `${emojis[index]} ${option}`).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#ffdd44')
                .setTitle(t('POLL_TITLE', lang))
                .setDescription(`**${question}**\n\n${description}`)
                .setFooter({ text: t('POLL_FOOTER', lang, { user: interaction.user.username }) })
                .setTimestamp();

            const message = await interaction.reply({ embeds: [embed], fetchReply: true });

            for (let i = 0; i < options.length; i++) {
                await message.react(emojis[i]);
            }

        } catch (error) {
            console.error('Error en comando poll:', error);
            const lang = await getLanguage(interaction.guildId);
            await interaction.reply({ content: t('IA_ERROR', lang), flags: 64 });
        }
    },
};