const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debate')
        .setNameLocalizations({ 'en-US': 'debate', 'en-GB': 'debate' })
        .setDescription('💎 [PREMIUM] La IA defiende o ataca cualquier argumento')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] The AI defends or attacks any argument', 'en-GB': '💎 [PREMIUM] The AI defends or attacks any argument' })
        .addStringOption(opt =>
            opt.setName('argumento')
                .setNameLocalizations({ 'en-US': 'argument', 'en-GB': 'argument' })
                .setDescription('El tema o argumento (ej: "La piña va en la pizza")')
                .setDescriptionLocalizations({ 'en-US': 'The topic or argument (e.g. "Pineapple belongs on pizza")', 'en-GB': 'The topic or argument (e.g. "Pineapple belongs on pizza")' })
                .setRequired(true)
                .setMaxLength(200))
        .addStringOption(opt =>
            opt.setName('posicion')
                .setNameLocalizations({ 'en-US': 'position', 'en-GB': 'position' })
                .setDescription('¿Qué posición debe tomar la IA?')
                .setDescriptionLocalizations({ 'en-US': 'What position should the AI take?', 'en-GB': 'What position should the AI take?' })
                .setRequired(false)
                .addChoices(
                    { name: '✅ A favor',     value: 'a favor' },
                    { name: '❌ En contra',   value: 'en contra' },
                    { name: '🎲 Aleatorio',   value: 'aleatorio' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de iniciar otro debate.`, flags: 64 });
        }

        const argumento = interaction.options.getString('argumento');
        let posicion    = interaction.options.getString('posicion') || 'aleatorio';
        if (posicion === 'aleatorio') posicion = Math.random() < 0.5 ? 'a favor' : 'en contra';

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const prompt = `Eres un debatiente experto y apasionado. Debes argumentar ${posicion} de lo siguiente: "${argumento}". Presenta exactamente 3 argumentos sólidos, creativos y convincentes numerados. Sé directo, usa datos o lógica, y termina con una frase impactante. Máximo 200 palabras. Idioma: español.`;

        try {
            const contenido = await generateAIMessage(prompt, 400);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar el debate. Intenta de nuevo.' });
            }

            const emoji = posicion === 'a favor' ? '✅' : '❌';

            const embed = new EmbedBuilder()
                .setColor(posicion === 'a favor' ? '#4ADE80' : '#FF4444')
                .setTitle(`${emoji} Debate: ${posicion.toUpperCase()}`)
                .setDescription(`**"${argumento}"**\n\n${contenido}`)
                .setFooter({ text: `Debate para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en debate:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar el debate.' });
        }
    }
};
