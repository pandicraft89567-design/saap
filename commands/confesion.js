const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confesion')
        .setNameLocalizations({ 'en-US': 'confession', 'en-GB': 'confession' })
        .setDescription('💎 [PREMIUM] Envía una confesión anónima al canal actual 🤫')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Send an anonymous confession to the current channel 🤫', 'en-GB': '💎 [PREMIUM] Send an anonymous confession to the current channel 🤫' })
        .addStringOption(opt =>
            opt.setName('mensaje')
                .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
                .setDescription('Tu confesión anónima (sé respetuoso)')
                .setDescriptionLocalizations({ 'en-US': 'Your anonymous confession (be respectful)', 'en-GB': 'Your anonymous confession (be respectful)' })
                .setRequired(true)
                .setMaxLength(500))
        .addStringOption(opt =>
            opt.setName('categoria')
                .setNameLocalizations({ 'en-US': 'category', 'en-GB': 'category' })
                .setDescription('Categoría de la confesión')
                .setDescriptionLocalizations({ 'en-US': 'Confession category', 'en-GB': 'Confession category' })
                .setRequired(false)
                .addChoices(
                    { name: '💕 Amor secreto',    value: '💕 Amor secreto' },
                    { name: '😳 Vergüenza',        value: '😳 Vergüenza' },
                    { name: '🤝 Amistad',          value: '🤝 Amistad' },
                    { name: '🎭 Otro',             value: '🎭 Confesión general' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 60000);
            return await interaction.reply({ content: `⏳ Espera **${remaining} min** antes de otra confesión.`, flags: 64 });
        }

        const mensaje   = interaction.options.getString('mensaje');
        const categoria = interaction.options.getString('categoria') || '🎭 Confesión general';

        const palabrasProhibidas = ['n-word', 'muerte', 'matar', 'suicid', 'bomb'];
        if (palabrasProhibidas.some(p => mensaje.toLowerCase().includes(p))) {
            return await interaction.reply({ content: '❌ Tu confesión contiene contenido no permitido.', flags: 64 });
        }

        COOLDOWNS.set(interaction.user.id, Date.now());

        const colores = { '💕 Amor secreto': '#FF69B4', '😳 Vergüenza': '#FF8C00', '🤝 Amistad': '#4ADE80', '🎭 Confesión general': '#C084FC' };

        const embed = new EmbedBuilder()
            .setColor(colores[categoria] || '#C084FC')
            .setTitle(`🤫 Confesión Anónima — ${categoria}`)
            .setDescription(`*"${mensaje}"*`)
            .setFooter({ text: 'Confesión anónima • Soledad ❣ Premium' })
            .setTimestamp();

        try {
            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: '✅ Tu confesión fue enviada de forma anónima. 🤫', flags: 64 });
        } catch (error) {
            console.error('Error en confesion:', error);
            if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: '❌ No pude enviar tu confesión. Verifica que tengo permisos en este canal.', flags: 64 }); } else { await interaction.reply({ content: '❌ No pude enviar tu confesión. Verifica que tengo permisos en este canal.', flags: 64 }); }
        }
    }
};
