const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const { generateAIMessage } = require('../utils/ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setNameLocalizations({ 'en-US': 'coinflip', 'en-GB': 'coinflip' })
        .setDescription('Lanza una moneda (cara o cruz)')
        .setDescriptionLocalizations({ 'en-US': 'Flip a coin (heads or tails)', 'en-GB': 'Flip a coin (heads or tails)' }),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = await getLanguage(interaction.guildId);
        const isHeads = Math.random() < 0.5;
        const result = isHeads ? t('COINFLIP_HEADS', lang) : t('COINFLIP_TAILS', lang);

        const prompt = lang === 'es'
            ? `Eres Soledad, un bot de Discord con personalidad tsundere. La moneda cayó en "${result}". Escribe UN comentario cortísimo (máximo 1 oración) en español: dramático, burlón o entusiasta. Sin emojis.`
            : `You are Soledad, a tsundere Discord bot. The coin landed on "${result}". Write ONE very short comment (max 1 sentence) in English: dramatic, mocking or enthusiastic. No emojis.`;

        const aiComment = await generateAIMessage(prompt, 50);

        const embed = new EmbedBuilder()
            .setTitle(t('COINFLIP_TITLE', lang))
            .setDescription(t('COINFLIP_RESULT', lang, { result }))
            .setColor('#f1c40f')
            .setTimestamp();

        if (aiComment) {
            embed.setFooter({ text: aiComment });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
