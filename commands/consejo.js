const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('consejo')
        .setNameLocalizations({ 'en-US': 'advice', 'en-GB': 'advice' })
        .setDescription('💎 [PREMIUM] Obtén un consejo personalizado de IA para tu situación')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Get personalized AI advice for your situation', 'en-GB': '💎 [PREMIUM] Get personalized AI advice for your situation' })
        .addStringOption(opt =>
            opt.setName('situacion')
                .setNameLocalizations({ 'en-US': 'situation', 'en-GB': 'situation' })
                .setDescription('Describe brevemente tu situación o problema')
                .setDescriptionLocalizations({ 'en-US': 'Briefly describe your situation or problem', 'en-GB': 'Briefly describe your situation or problem' })
                .setRequired(true)
                .setMaxLength(300))
        .addStringOption(opt =>
            opt.setName('area')
                .setNameLocalizations({ 'en-US': 'area', 'en-GB': 'area' })
                .setDescription('Área de vida')
                .setDescriptionLocalizations({ 'en-US': 'Life area', 'en-GB': 'Life area' })
                .setRequired(false)
                .addChoices(
                    { name: '💕 Amor / relaciones',  value: 'amor y relaciones' },
                    { name: '💼 Trabajo / carrera',  value: 'trabajo y carrera' },
                    { name: '👥 Amistad',             value: 'amistad' },
                    { name: '🧠 Salud mental',        value: 'salud mental y bienestar' },
                    { name: '💰 Dinero / finanzas',   value: 'finanzas personales' },
                    { name: '🎯 Metas / motivación',  value: 'metas y motivación' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de pedir otro consejo.`, flags: 64 });
        }

        const situacion = interaction.options.getString('situacion');
        const area      = interaction.options.getString('area') || 'vida personal';

        await interaction.deferReply({ flags: 64 });
        COOLDOWNS.set(interaction.user.id, Date.now());

        const nombre = interaction.user.globalName ?? interaction.user.username;
        const prompt = `Eres un consejero empático, sabio y práctico. ${nombre} necesita consejo sobre ${area}. Su situación: "${situacion}". Da un consejo genuino, específico y útil. Sé directo pero compasivo. Incluye: 1) Un consejo principal claro, 2) Un paso concreto que puede hacer hoy, 3) Una frase motivadora al final. Máximo 180 palabras. En español.`;

        try {
            const contenido = await generateAIMessage(prompt, 350);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar el consejo. Intenta de nuevo.' });
            }

            const areaEmoji = {
                'amor y relaciones': '💕', 'trabajo y carrera': '💼', 'amistad': '👥',
                'salud mental y bienestar': '🧠', 'finanzas personales': '💰', 'metas y motivación': '🎯', 'vida personal': '🌟'
            };

            const embed = new EmbedBuilder()
                .setColor('#C084FC')
                .setTitle(`${areaEmoji[area] || '🌟'} Consejo personalizado`)
                .setDescription(contenido)
                .setFooter({ text: `Solo para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en consejo:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar el consejo.' });
        }
    }
};
