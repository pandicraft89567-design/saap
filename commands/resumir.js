const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 30 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resumir')
        .setNameLocalizations({ 'en-US': 'summarize', 'en-GB': 'summarize' })
        .setDescription('💎 [PREMIUM] Resume un texto largo con IA')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Summarize a long text with AI', 'en-GB': '💎 [PREMIUM] Summarize a long text with AI' })
        .addStringOption(opt =>
            opt.setName('texto')
                .setNameLocalizations({ 'en-US': 'text', 'en-GB': 'text' })
                .setDescription('Texto a resumir (mínimo 50 caracteres)')
                .setDescriptionLocalizations({ 'en-US': 'Text to summarize (minimum 50 characters)', 'en-GB': 'Text to summarize (minimum 50 characters)' })
                .setRequired(true)
                .setMaxLength(2000)),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de resumir otro texto.`, flags: 64 });
        }

        const texto = interaction.options.getString('texto');
        if (texto.length < 50) {
            return await interaction.reply({ content: '❌ El texto debe tener al menos 50 caracteres.', flags: 64 });
        }

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const prompt = `Resume el siguiente texto en español de forma clara y concisa en máximo 3-4 oraciones, destacando los puntos más importantes. Texto: "${texto}"`;

        try {
            const resumen = await generateAIMessage(prompt, 300);

            if (!resumen) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude resumir el texto. Intenta de nuevo.' });
            }

            const embed = new EmbedBuilder()
                .setColor('#60A5FA')
                .setTitle('📝 Resumen IA')
                .addFields(
                    { name: '📄 Original', value: texto.length > 300 ? texto.slice(0, 300) + '...' : texto, inline: false },
                    { name: '✨ Resumen',  value: resumen,                                                     inline: false }
                )
                .setFooter({ text: `Resumido por IA para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en resumir:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al resumir el texto.' });
        }
    }
};
