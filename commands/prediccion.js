const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prediccion')
        .setNameLocalizations({ 'en-US': 'prediction', 'en-GB': 'prediction' })
        .setDescription('💎 [PREMIUM] La IA predice tu futuro de forma mística y personalizada 🔮')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] The AI mystically predicts your future 🔮', 'en-GB': '💎 [PREMIUM] The AI mystically predicts your future 🔮' })
        .addStringOption(opt =>
            opt.setName('pregunta')
                .setNameLocalizations({ 'en-US': 'question', 'en-GB': 'question' })
                .setDescription('¿Qué aspecto de tu futuro quieres conocer? (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'What aspect of your future do you want to know? (optional)', 'en-GB': 'What aspect of your future do you want to know? (optional)' })
                .setRequired(false)
                .setMaxLength(150)),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 60000);
            return await interaction.reply({ content: `⏳ Las estrellas necesitan **${remaining} min** para recargarse.`, flags: 64 });
        }

        const pregunta = interaction.options.getString('pregunta');

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const nombre = interaction.user.globalName ?? interaction.user.username;
        const fecha  = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const contexto = pregunta ? `Se quiere saber específicamente: "${pregunta}"` : 'Haz una predicción general de su futuro cercano.';
        const prompt = `Eres una vidente mística y misteriosa llamada Soledad. ${contexto} El nombre de la persona es "${nombre}" y la fecha de hoy es ${fecha}. Haz una predicción del futuro intrigante, específica y esperanzadora (pero no garantices nada real). Incluye: futuro cercano (próximas semanas), un aviso o consejo misterioso, y un símbolo o signo del destino. Sé poética y mística. 150-200 palabras. En español.`;

        try {
            const contenido = await generateAIMessage(prompt, 400);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ Las estrellas no responden ahora. Intenta más tarde.' });
            }

            const embed = new EmbedBuilder()
                .setColor('#7C3AED')
                .setTitle('🔮 Predicción del Destino')
                .setDescription(`*${contenido}*`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Lectura para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            if (pregunta) {
                embed.addFields({ name: '❓ Tu pregunta', value: pregunta, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en prediccion:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al leer el destino.' });
        }
    }
};
