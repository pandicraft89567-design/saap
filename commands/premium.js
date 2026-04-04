const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { Client } = require('pg');

const OWNER_IDS = ['766405066860527688', '738425516155076629'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setNameLocalizations({ 'en-US': 'premium', 'en-GB': 'premium' })
        .setDescription('Comandos exclusivos para usuarios Premium')
        .setDescriptionLocalizations({ 'en-US': 'Exclusive commands for Premium users', 'en-GB': 'Exclusive commands for Premium users' })
        .addSubcommand(subcommand =>
            subcommand.setName('list').setNameLocalizations({ 'en-US': 'list', 'en-GB': 'list' }).setDescription('Lista todos los comandos premium disponibles').setDescriptionLocalizations({ 'en-US': 'List all available premium commands', 'en-GB': 'List all available premium commands' }))
        .addSubcommand(subcommand =>
            subcommand.setName('status').setNameLocalizations({ 'en-US': 'status', 'en-GB': 'status' }).setDescription('Mira tu estado Premium').setDescriptionLocalizations({ 'en-US': 'Check your Premium status', 'en-GB': 'Check your Premium status' }))
        .addSubcommand(subcommand =>
            subcommand.setName('block-channel').setNameLocalizations({ 'en-US': 'block-channel', 'en-GB': 'block-channel' }).setDescription('Bloquea o desbloquea a un usuario de este canal (Premium)').setDescriptionLocalizations({ 'en-US': 'Block or unblock a user from this channel (Premium)', 'en-GB': 'Block or unblock a user from this channel (Premium)' })
                .addUserOption(option => option.setName('usuario').setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' }).setDescription('Usuario a bloquear/desbloquear').setDescriptionLocalizations({ 'en-US': 'User to block/unblock', 'en-GB': 'User to block/unblock' }).setRequired(true))
                .addStringOption(option =>
                    option.setName('accion').setNameLocalizations({ 'en-US': 'action', 'en-GB': 'action' }).setDescription('¿Bloquear o desbloquear?').setDescriptionLocalizations({ 'en-US': 'Block or unblock?', 'en-GB': 'Block or unblock?' }).setRequired(false)
                        .addChoices(
                            { name: '🔒 Bloquear', value: 'bloquear' },
                            { name: '🔓 Desbloquear', value: 'desbloquear' }
                        )))
        .addSubcommand(subcommand =>
            subcommand.setName('patear').setNameLocalizations({ 'en-US': 'kick', 'en-GB': 'kick' }).setDescription('Expulsa a un usuario del servidor (Premium/Admin)').setDescriptionLocalizations({ 'en-US': 'Kick a user from the server (Premium/Admin)', 'en-GB': 'Kick a user from the server (Premium/Admin)' })
                .addUserOption(option => option.setName('usuario').setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' }).setDescription('Usuario a expulsar').setDescriptionLocalizations({ 'en-US': 'User to kick', 'en-GB': 'User to kick' }).setRequired(true))
                .addStringOption(option => option.setName('razon').setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' }).setDescription('Razón de la expulsión').setDescriptionLocalizations({ 'en-US': 'Reason for the kick', 'en-GB': 'Reason for the kick' })))
        .addSubcommand(subcommand =>
            subcommand.setName('ghost-msg').setNameLocalizations({ 'en-US': 'ghost-msg', 'en-GB': 'ghost-msg' }).setDescription('Envía un mensaje que se autodestruye (Premium)').setDescriptionLocalizations({ 'en-US': 'Send a self-destructing message (Premium)', 'en-GB': 'Send a self-destructing message (Premium)' })
                .addStringOption(option => option.setName('mensaje').setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' }).setDescription('Contenido del mensaje').setDescriptionLocalizations({ 'en-US': 'Message content', 'en-GB': 'Message content' }).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('nick').setNameLocalizations({ 'en-US': 'nick', 'en-GB': 'nick' }).setDescription('Cambia tu apodo con símbolos especiales (Premium)').setDescriptionLocalizations({ 'en-US': 'Change your nickname with special symbols (Premium)', 'en-GB': 'Change your nickname with special symbols (Premium)' })
                .addStringOption(option => option.setName('apodo').setNameLocalizations({ 'en-US': 'nickname', 'en-GB': 'nickname' }).setDescription('Tu nuevo apodo').setDescriptionLocalizations({ 'en-US': 'Your new nickname', 'en-GB': 'Your new nickname' }).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('exclusive-avatar').setNameLocalizations({ 'en-US': 'exclusive-avatar', 'en-GB': 'exclusive-avatar' }).setDescription('Efecto premium para tu avatar').setDescriptionLocalizations({ 'en-US': 'Premium effect for your avatar', 'en-GB': 'Premium effect for your avatar' })),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        try {
            const res = await db.query('SELECT premium_until FROM economy WHERE user_id = $1', [userId]);
            const premiumUntil = res.rows[0]?.premium_until ? new Date(res.rows[0].premium_until) : null;
            const isPremium = OWNER_IDS.includes(userId) || (premiumUntil && premiumUntil > new Date());

            if (subcommand === 'list') {
                const embed = new EmbedBuilder()
                    .setTitle('<a:lux:1385222769566027836> Lista de Comandos Premium')
                    .setColor('#00FFFF')
                    .setDescription('Funciones exclusivas para miembros **VIP**. Obtén Premium con `/shop`.')
                    .addFields(
                        { name: '💸 /transferir', value: 'Transfiere Solecoins a otro usuario (5% comisión, cooldown 5 min).', inline: false },
                        { name: '💌 /carta', value: 'Genera una carta, poema o mensaje especial con IA para alguien (cooldown 2 min).', inline: false },
                        { name: '🔮 /horoscopo', value: 'Tu horóscopo diario exclusivo con IA según tu signo zodiacal (cooldown 12 h).', inline: false },
                        { name: '📝 /bio', value: 'Personaliza tu bio en el perfil (hasta 200 caracteres).', inline: false },
                        { name: '📋 /auditoria', value: 'Ve el log de auditoría: baneos, kicks, roles y más.', inline: false },
                        { name: '🌟 /daily-premium', value: 'Daily especial con 3× más Solecoins + ítem bonus.', inline: false },
                        { name: '🚀 /serverpost', value: 'Publica tu servidor en la lista global de destacados.', inline: false },
                        { name: '🔒 /premium block-channel', value: 'Bloquea o desbloquea a un usuario de este canal.', inline: false },
                        { name: '👢 /premium patear', value: 'Expulsa a un usuario (requiere permisos de Staff).', inline: false },
                        { name: '👻 /premium ghost-msg', value: 'Mensaje que desaparece en 10 segundos.', inline: false },
                        { name: '✨ /premium nick', value: 'Cambia tu apodo con decoración brillante ✨.', inline: false },
                        { name: '🖼️ /premium exclusive-avatar', value: 'Muestra tu avatar con aura dorada VIP.', inline: false }
                    )
                    .setFooter({ text: 'Soledad ❣ Premium • /shop para suscribirte' });
                return await interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'status') {
                const statusText = OWNER_IDS.includes(userId)
                    ? '✨ Tienes **Premium Permanente** por ser el dueño del bot.'
                    : (isPremium
                        ? `✨ Eres un usuario **Premium**.\n📅 Vence el: \`${premiumUntil.toLocaleDateString()}\``
                        : '❌ No tienes una suscripción Premium activa.\n🛒 Usa `/shop` para comprar una con Solecoins.');

                const embed = new EmbedBuilder()
                    .setTitle('<a:lux:1385222769566027836> Estado Premium')
                    .setColor(isPremium ? '#00FFFF' : '#99AAB5')
                    .setDescription(statusText);
                return await interaction.editReply({ embeds: [embed] });
            }

            if (!isPremium) {
                return await interaction.editReply({ content: '<a:no:1385229842282446898> Este comando es exclusivo para usuarios **Premium**. Compra tu suscripción en `/shop`.' });
            }

            if (subcommand === 'block-channel') {
                const target = interaction.options.getMember('usuario');
                const accion = interaction.options.getString('accion') || 'bloquear';

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.editReply({ content: '❌ Necesitas permisos de **Gestionar Canales** para usar esto.' });
                }
                if (!target) {
                    return await interaction.editReply({ content: '❌ No se encontró al usuario en este servidor.' });
                }
                if (target.id === interaction.user.id) {
                    return await interaction.editReply({ content: '❌ No puedes bloquearte/desbloquearte a ti mismo.' });
                }
                if (target.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.editReply({ content: '❌ No puedes usar esto sobre alguien con roles iguales o superiores al tuyo.' });
                }
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.editReply({ content: '❌ No tengo permisos para gestionar este canal.' });
                }

                if (accion === 'desbloquear') {
                    await interaction.channel.permissionOverwrites.delete(target).catch(() => {});
                    const embed = new EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle('🔓 Canal Desbloqueado')
                        .setDescription(`${target} ahora puede ver este canal nuevamente.`)
                        .addFields({ name: '🛡️ Ejecutado por', value: `${interaction.user}`, inline: true })
                        .setFooter({ text: 'Soledad ❣ Premium' })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                }

                await interaction.channel.permissionOverwrites.create(target, { ViewChannel: false, SendMessages: false });
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('🔒 Canal Bloqueado')
                    .setDescription(`${target} ha sido bloqueado de este canal.`)
                    .addFields(
                        { name: '🛡️ Ejecutado por', value: `${interaction.user}`, inline: true },
                        { name: '💡 Para desbloquear', value: '`/premium block-channel accion:Desbloquear`', inline: false }
                    )
                    .setFooter({ text: 'Soledad ❣ Premium' })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'patear') {
                const target = interaction.options.getMember('usuario');
                const reason = interaction.options.getString('razon') || 'Sin razón especificada';

                if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                    return await interaction.editReply({ content: '❌ No tienes permisos para expulsar miembros.' });
                }
                if (!target) {
                    return await interaction.editReply({ content: '❌ No se encontró al usuario en este servidor.' });
                }
                if (target.id === interaction.user.id) {
                    return await interaction.editReply({ content: '❌ No puedes expulsarte a ti mismo.' });
                }
                if (target.id === interaction.guild.ownerId) {
                    return await interaction.editReply({ content: '❌ No puedes expulsar al dueño del servidor.' });
                }
                if (target.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.editReply({ content: '❌ No puedes expulsar a alguien con roles iguales o superiores al tuyo.' });
                }
                if (!target.kickable) {
                    return await interaction.editReply({ content: '❌ No puedo expulsar a este usuario. Puede tener un rol superior al mío.' });
                }

                await target.kick(`[Premium] ${reason} | Por: ${interaction.user.tag}`);

                const embed = new EmbedBuilder()
                    .setColor('#E67E22')
                    .setTitle('👢 Usuario Expulsado')
                    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: '👤 Usuario', value: `${target.user.tag} (${target.id})`, inline: true },
                        { name: '🛡️ Expulsado por', value: `${interaction.user.tag}`, inline: true },
                        { name: '📋 Razón', value: reason, inline: false }
                    )
                    .setFooter({ text: 'Soledad ❣ Premium' })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'ghost-msg') {
                const msg = interaction.options.getString('mensaje');
                await interaction.editReply({ content: `👻 **Mensaje Fantasma de ${interaction.user}:** ${msg}\n*⏳ Se autodestruirá en 10 segundos...*` });
                setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
                return;
            }

            if (subcommand === 'nick') {
                const newNick = interaction.options.getString('apodo');
                const decoratedNick = `✨ ${newNick} ✨`;

                if (decoratedNick.length > 32) {
                    return await interaction.editReply({ content: `❌ El apodo es demasiado largo. Usa máximo **28 caracteres** (el decorado añade 6 más).` });
                }

                if (interaction.member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.editReply({ content: '❌ No puedo cambiar el apodo de alguien con roles iguales o superiores al mío.' });
                }

                try {
                    await interaction.member.setNickname(decoratedNick);
                    const embed = new EmbedBuilder()
                        .setColor('#00FFFF')
                        .setTitle('<a:lux:1385222769566027836> Apodo Premium Actualizado')
                        .setDescription(`Tu apodo ha sido actualizado con decoración Premium.`)
                        .addFields({ name: '✨ Nuevo Apodo', value: `**${decoratedNick}**`, inline: false })
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: 'Soledad ❣ Premium' })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    return await interaction.editReply({ content: '❌ No pude cambiar tu apodo. Puede que mi rol no tenga permisos suficientes.' });
                }
            }

            if (subcommand === 'exclusive-avatar') {
                const avatarURL = interaction.user.displayAvatarURL({ size: 4096, dynamic: true, format: 'png' });
                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('<a:lux:1385222769566027836> Aura Premium Activada')
                    .setDescription(
                        `✨ **${interaction.user.globalName ?? interaction.user.username}**, tu perfil ahora irradia el aura Premium.\n\n` +
                        `> 🌟 **Aura:** Dorada VIP\n` +
                        `> 💎 **Rango:** Premium Exclusivo\n` +
                        `> 🔮 **Estado:** Activo\n\n` +
                        `*Tu foto de perfil ha sido marcada como Premium en Soledad.*`
                    )
                    .setImage(avatarURL)
                    .setThumbnail('https://cdn.discordapp.com/emojis/1385222769566027836.gif')
                    .setFooter({ text: 'Soledad ❣ Premium • Aura Exclusiva' })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

        } finally {
            await db.end();
        }
    },
};
