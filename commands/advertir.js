const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

const PROTECTED_USER = '832641595110719509';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('advertir')
        .setNameLocalizations({ 'en-US': 'warn', 'en-GB': 'warn' })
        .setDescription('Advierte a un usuario con un mensaje generado por IA')
        .setDescriptionLocalizations({ 'en-US': 'Warn a user with an AI-generated message', 'en-GB': 'Warn a user with an AI-generated message' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario a advertir')
                .setDescriptionLocalizations({ 'en-US': 'User to warn', 'en-GB': 'User to warn' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón de la advertencia')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the warning', 'en-GB': 'Reason for the warning' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('destino')
                .setNameLocalizations({ 'en-US': 'destination', 'en-GB': 'destination' })
                .setDescription('¿Dónde se envía la advertencia?')
                .setDescriptionLocalizations({ 'en-US': 'Where to send the warning?', 'en-GB': 'Where to send the warning?' })
                .setRequired(true)
                .addChoices(
                    { name: '📢 Canal actual (visible para todos)', value: 'canal_actual' },
                    { name: '🔒 Privado (MD al usuario)', value: 'privado' },
                    { name: '📌 Canal específico', value: 'otro_canal' }
                ))
        .addChannelOption(option =>
            option.setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal donde publicar la advertencia (solo si elegiste "Canal específico")')
                .setDescriptionLocalizations({ 'en-US': 'Channel to post the warning in (only if "Specific channel" chosen)', 'en-GB': 'Channel to post the warning in (only if "Specific channel" chosen)' })
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const razon = interaction.options.getString('razon');
        const destino = interaction.options.getString('destino');
        const canalEspecifico = interaction.options.getChannel('canal');

        // Protección novia
        if (targetUser.id === PROTECTED_USER) {
            return interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        // No advertir bots
        if (targetUser.bot) {
            return interaction.reply({
                content: '⚙️ No puedo advertir a un bot, eso no tiene sentido...',
                flags: 64
            });
        }

        // No advertirse a uno mismo
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '¿Te quieres advertir a ti mismo...? Eso es un poco patético, ¿no?',
                flags: 64
            });
        }

        // Validar canal específico
        if (destino === 'otro_canal' && !canalEspecifico) {
            return interaction.reply({
                content: '⚠️ Debes seleccionar un canal cuando eliges "Canal específico".',
                flags: 64
            });
        }

        // Diferir: público si va al canal actual, privado en los demás casos
        const esPublico = destino === 'canal_actual';
        await interaction.deferReply({ ephemeral: !esPublico });

        // Generar el mensaje con IA
        const prompt = `Eres Soledad ❣, un bot de Discord con personalidad tsundere: eres fría, directa y un poco dramática, pero en el fondo te importa el servidor.

Un moderador ha advertido al usuario "${targetUser.username}" por la siguiente razón: "${razon}".

Genera un mensaje de advertencia oficial para ese usuario. El mensaje debe:
- Estar dirigido directamente al usuario por su nombre
- Mencionar claramente la razón de la advertencia
- Tener un tono firme pero con la personalidad tsundere (un poco dramática, algo condescendiente, pero justa)
- Terminar con una amenaza suave de consecuencias si continúa
- Ser en español
- Tener entre 2 y 4 oraciones
- NO usar asteriscos ni markdown de negrita`;

        const aiWarn = await generateAIMessage(prompt, 200);
        const warnText = aiWarn ||
            `Oye ${targetUser.username}, recibiste una advertencia por: **${razon}**. Más te vale comportarte o habrá consecuencias... ¡no es una amenaza, es una promesa!`;

        const embed = new EmbedBuilder()
            .setColor(0xFF6B35)
            .setTitle('<a:barrier:1385229854353526828> Advertencia Oficial')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setDescription(warnText)
            .addFields(
                { name: '👤 Usuario', value: `${targetUser} (${targetUser.tag})`, inline: true },
                { name: '🛡️ Moderador', value: `${interaction.user}`, inline: true },
                { name: '📋 Razón', value: razon, inline: false }
            )
            .setFooter({ text: 'Soledad ❣ • Sistema de Moderación' })
            .setTimestamp();

        // ── CANAL ACTUAL ── visible para todos en el canal donde se usó el comando
        if (destino === 'canal_actual') {
            await interaction.editReply({ content: `${targetUser}`, embeds: [embed] });
            return;
        }

        // ── PRIVADO ── se manda como MD al usuario
        if (destino === 'privado') {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF6B35)
                    .setTitle(`<a:barrier:1385229854353526828> Has recibido una advertencia en ${interaction.guild.name}`)
                    .setDescription(warnText)
                    .addFields({ name: '📋 Razón', value: razon })
                    .setFooter({ text: 'Soledad ❣ • Sistema de Moderación' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
                await interaction.editReply({
                    content: `✅ Advertencia enviada por MD a **${targetUser.username}**.`
                });
            } catch {
                await interaction.editReply({
                    content: `❌ No pude enviar el MD a **${targetUser.username}** (tiene los MDs desactivados). Prueba enviarlo al canal actual o a un canal específico.`
                });
            }
            return;
        }

        // ── CANAL ESPECÍFICO ── se envía al canal elegido
        if (destino === 'otro_canal') {
            try {
                await canalEspecifico.send({ content: `${targetUser}`, embeds: [embed] });
                await interaction.editReply({
                    content: `✅ Advertencia publicada en ${canalEspecifico}.`
                });
            } catch {
                await interaction.editReply({
                    content: `❌ No tengo permisos para enviar mensajes en ${canalEspecifico}.`
                });
            }
        }
    }
};
