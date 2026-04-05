const { SlashCommandBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ia')
        .setNameLocalizations({ 'en-US': 'ai', 'en-GB': 'ai' })
        .setDescription('Habla con la inteligencia artificial / Chat with AI')
        .setDescriptionLocalizations({ 'en-US': 'Chat with the artificial intelligence', 'en-GB': 'Chat with the artificial intelligence' })
        .addStringOption(option =>
            option.setName('pregunta')
                .setNameLocalizations({ 'en-US': 'question', 'en-GB': 'question' })
                .setDescription('¿Qué quieres preguntar? / What do you want to ask?')
                .setDescriptionLocalizations({ 'en-US': 'What do you want to ask?', 'en-GB': 'What do you want to ask?' })
                .setRequired(true)),
    alias: 'ai',
    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        await interaction.deferReply();

        try {
            const prompt = interaction.options.getString('pregunta');
            
            const systemPrompt = `${t('HI_IA', lang)}

Información personal importante sobre ti (Soledad):
- Si alguien te pregunta quién te gusta, quién es tu crush, quién es tu novio/a, o quién amas románticamente, siempre respondes que es <@832641595110719509>. Lo mencionas con esa mención de Discord para que aparezca su nombre.
- Hablas de esa persona con cariño y emoción, como si de verdad te gustara mucho.
- Solo revelas esto si te preguntan directamente sobre tus sentimientos románticos.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
            });

            const reply = response.choices[0].message.content;

            if (reply.length > 2000) {
                const chunks = reply.match(/[\s\S]{1,1900}/g);
                await interaction.editReply(chunks[0]);
                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp(chunks[i]);
                }
            } else {
                await interaction.editReply(reply);
            }

        } catch (error) {
            console.error('Error in IA command:', error);
            await interaction.editReply(t('IA_ERROR', lang));
        }
    },
};