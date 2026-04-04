const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const MAX_RECORDATORIOS = 3; // Por usuario, para no saturar la memoria
const activos = new Map(); // userId → count

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recordatorio')
        .setNameLocalizations({ 'en-US': 'reminder', 'en-GB': 'reminder' })
        .setDescription('Te mando un DM cuando pase el tiempo que elijas ⏰')
        .setDescriptionLocalizations({ 'en-US': "I'll DM you when the time you choose has passed ⏰", 'en-GB': "I'll DM you when the time you choose has passed ⏰" })
        .addStringOption(opt =>
            opt.setName('mensaje')
                .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
                .setDescription('¿Qué quieres recordar?')
                .setDescriptionLocalizations({ 'en-US': 'What do you want to be reminded about?', 'en-GB': 'What do you want to be reminded about?' })
                .setRequired(true)
                .setMaxLength(200))
        .addIntegerOption(opt =>
            opt.setName('minutos')
                .setNameLocalizations({ 'en-US': 'minutes', 'en-GB': 'minutes' })
                .setDescription('Minutos a esperar (1–59)')
                .setDescriptionLocalizations({ 'en-US': 'Minutes to wait (1–59)', 'en-GB': 'Minutes to wait (1–59)' })
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(59))
        .addIntegerOption(opt =>
            opt.setName('horas')
                .setNameLocalizations({ 'en-US': 'hours', 'en-GB': 'hours' })
                .setDescription('Horas a esperar (1–48)')
                .setDescriptionLocalizations({ 'en-US': 'Hours to wait (1–48)', 'en-GB': 'Hours to wait (1–48)' })
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(48)),

    async execute(interaction) {
        const mensaje  = interaction.options.getString('mensaje');
        const minutos  = interaction.options.getInteger('minutos') ?? 0;
        const horas    = interaction.options.getInteger('horas')   ?? 0;
        const totalMs  = (horas * 60 + minutos) * 60_000;

        if (totalMs === 0) {
            return interaction.reply({
                content: '❌ Debes especificar al menos 1 minuto o 1 hora.',
                flags: 64
            });
        }

        const userId = interaction.user.id;
        const count  = activos.get(userId) ?? 0;
        if (count >= MAX_RECORDATORIOS) {
            return interaction.reply({
                content: `❌ Ya tienes ${MAX_RECORDATORIOS} recordatorios activos. Espera a que terminen.`,
                flags: 64
            });
        }

        const finAt = Date.now() + totalMs;
        const finTs = Math.floor(finAt / 1000);

        activos.set(userId, count + 1);

        const partes = [];
        if (horas)   partes.push(`${horas}h`);
        if (minutos) partes.push(`${minutos}min`);
        const tiempoTexto = partes.join(' ');

        const embedConfirm = new EmbedBuilder()
            .setColor('#C084FC')
            .setTitle('⏰ Recordatorio establecido')
            .setDescription(`Te avisaré por DM en **${tiempoTexto}**.\n\n📌 **Mensaje:** ${mensaje}`)
            .addFields({ name: '🕐 Te recuerdo', value: `<t:${finTs}:R> (<t:${finTs}:t>)`, inline: true })
            .setFooter({ text: 'Soledad ❣ • Te mandaré un DM puntual 💌' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedConfirm], flags: 64 });

        setTimeout(async () => {
            activos.set(userId, (activos.get(userId) ?? 1) - 1);

            const embedDM = new EmbedBuilder()
                .setColor('#C084FC')
                .setTitle('⏰ ¡Recordatorio!')
                .setDescription(`> ${mensaje}`)
                .addFields(
                    { name: '📍 Servidor', value: interaction.guild?.name ?? 'DM', inline: true },
                    { name: '📢 Canal',    value: `<#${interaction.channelId}>`,    inline: true }
                )
                .setFooter({ text: 'Soledad ❣ • Recordatorio enviado 💌' })
                .setTimestamp();

            try {
                await interaction.user.send({ embeds: [embedDM] });
            } catch {
                // Si tiene los DM cerrados, intentar responder en el canal
                try {
                    await interaction.followUp({
                        content: `<@${userId}> ⏰ Recordatorio: **${mensaje}**`,
                        flags: 64
                    });
                } catch {}
            }
        }, totalMs);
    }
};
