const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rima')
        .setNameLocalizations({ 'en-US': 'rhyme', 'en-GB': 'rhyme' })
        .setDescription('💎 [PREMIUM] La IA crea una rima o rap sobre cualquier tema')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] The AI creates a rhyme or rap about any topic', 'en-GB': '💎 [PREMIUM] The AI creates a rhyme or rap about any topic' })
        .addStringOption(opt =>
            opt.setName('tema')
                .setNameLocalizations({ 'en-US': 'topic', 'en-GB': 'topic' })
                .setDescription('Tema del rap/rima (ej: el lunes, tu gato, las tareas)')
                .setDescriptionLocalizations({ 'en-US': 'Rap/rhyme topic (e.g. Monday, your cat, homework)', 'en-GB': 'Rap/rhyme topic (e.g. Monday, your cat, homework)' })
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(opt =>
            opt.setName('estilo')
                .setNameLocalizations({ 'en-US': 'style', 'en-GB': 'style' })
                .setDescription('Estilo')
                .setDescriptionLocalizations({ 'en-US': 'Style', 'en-GB': 'Style' })
                .setRequired(false)
                .addChoices(
                    { name: '🎤 Rap callejero',   value: 'rap callejero con flow urbano' },
                    { name: '🌹 Rima romántica',   value: 'rima romántica y poética' },
                    { name: '😂 Rima cómica',      value: 'rima cómica y absurda' },
                    { name: '🔥 Freestyle',        value: 'freestyle sin filtros pero divertido' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de otra rima.`, flags: 64 });
        }

        const tema   = interaction.options.getString('tema');
        const estilo = interaction.options.getString('estilo') || 'rap callejero con flow urbano';

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const nombre = interaction.user.globalName ?? interaction.user.username;
        const prompt = `Eres un rapero y poeta creativo. Escribe una rima/rap estilo ${estilo} sobre "${tema}" dedicado a ${nombre}. Mínimo 8 líneas con buena rima y ritmo. Hazlo original, divertido y con personalidad. En español.`;

        try {
            const contenido = await generateAIMessage(prompt, 350);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar la rima. Intenta de nuevo.' });
            }

            const estiloEmoji = {
                'rap callejero con flow urbano': '🎤',
                'rima romántica y poética': '🌹',
                'rima cómica y absurda': '😂',
                'freestyle sin filtros pero divertido': '🔥'
            };

            const embed = new EmbedBuilder()
                .setColor('#FBBF24')
                .setTitle(`${estiloEmoji[estilo] || '🎵'} Rima: "${tema}"`)
                .setDescription(`\`\`\`\n${contenido}\n\`\`\``)
                .setFooter({ text: `Escrita para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en rima:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar la rima.' });
        }
    }
};
