const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const { generateAIMessage } = require('../utils/ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setNameLocalizations({ 'en-US': 'ping', 'en-GB': 'ping' })
        .setDescription('Responde con pong para probar si el bot funciona')
        .setDescriptionLocalizations({ 'en-US': 'Responds with pong to test if the bot works', 'en-GB': 'Responds with pong to test if the bot works' }),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        await interaction.deferReply();

        const ping = interaction.client.ws.ping;

        const prompt = lang === 'es'
            ? `Eres Soledad, un bot de Discord con personalidad tsundere. Tu latencia es de ${ping}ms. Haz un comentario sarcástico, dramático o tierno al respecto en español (máximo 1 oración corta). Sin emojis al inicio.`
            : `You are Soledad, a tsundere Discord bot. Your latency is ${ping}ms. Make a sarcastic, dramatic or sweet comment about it in English (max 1 short sentence). No leading emojis.`;

        const aiComment = await generateAIMessage(prompt, 50);

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(t('PING_MSG', lang, { ping }))
            .setColor('#5865F2')
            .setTimestamp();

        if (aiComment) {
            embed.setFooter({ text: aiComment });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
