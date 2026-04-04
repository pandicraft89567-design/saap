const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 2 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cumple')
        .setNameLocalizations({ 'en-US': 'birthday', 'en-GB': 'birthday' })
        .setDescription('💎 [PREMIUM] Genera un mensaje de cumpleaños especial con IA 🎂')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Generate a special AI birthday message 🎂', 'en-GB': '💎 [PREMIUM] Generate a special AI birthday message 🎂' })
        .addUserOption(opt =>
            opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién le deseas feliz cumpleaños?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to wish happy birthday?', 'en-GB': 'Who do you want to wish happy birthday?' })
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('detalle')
                .setNameLocalizations({ 'en-US': 'detail', 'en-GB': 'detail' })
                .setDescription('Algo especial sobre esta persona o su relación contigo (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Something special about this person or your relationship (optional)', 'en-GB': 'Something special about this person or your relationship (optional)' })
                .setRequired(false)
                .setMaxLength(150))
        .addStringOption(opt =>
            opt.setName('estilo')
                .setNameLocalizations({ 'en-US': 'style', 'en-GB': 'style' })
                .setDescription('Estilo del mensaje')
                .setDescriptionLocalizations({ 'en-US': 'Message style', 'en-GB': 'Message style' })
                .setRequired(false)
                .addChoices(
                    { name: '💕 Emotivo y tierno',     value: 'emotivo y tierno' },
                    { name: '😂 Gracioso y divertido',  value: 'gracioso y divertido' },
                    { name: '🎉 Festivo y energético',  value: 'festivo y enérgico' },
                    { name: '🌹 Romántico',              value: 'romántico y especial' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de otro mensaje de cumpleaños.`, flags: 64 });
        }

        const target  = interaction.options.getUser('usuario');
        const detalle = interaction.options.getString('detalle') || '';
        const estilo  = interaction.options.getString('estilo') || 'emotivo y tierno';

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const de   = interaction.user.globalName ?? interaction.user.username;
        const para = target.globalName ?? target.username;
        const extra = detalle ? ` Dato especial: "${detalle}".` : '';

        const prompt = `Eres un escritor creativo. Escribe un mensaje de cumpleaños ${estilo} de parte de "${de}" para "${para}".${extra} El mensaje debe ser original, cálido y memorable. Entre 80 y 130 palabras. Sin título. En español.`;

        try {
            const contenido = await generateAIMessage(prompt, 300);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar el mensaje. Intenta de nuevo.' });
            }

            const estiloEmoji = {
                'emotivo y tierno': '💕', 'gracioso y divertido': '😂',
                'festivo y enérgico': '🎉', 'romántico y especial': '🌹'
            };

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`${estiloEmoji[estilo] || '🎂'} ¡Feliz Cumpleaños, ${para}!`)
                .setDescription(`*${contenido}*`)
                .addFields(
                    { name: '🎁 De',   value: `${interaction.user}`, inline: true },
                    { name: '🎂 Para', value: `${target}`,            inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Escrito con IA y mucho cariño • Soledad ❣ Premium' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en cumple:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar el mensaje.' });
        }
    }
};
