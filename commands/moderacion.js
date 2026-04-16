const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

const PROTECTED_USER_ID = '832641595110719509';

function parseDuration(duration) {
    const match = duration.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return 600000;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] * value;
    const MAX = 28 * 24 * 60 * 60 * 1000;
    return Math.min(Math.max(ms, 1000), MAX);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderacion')
        .setDescription('Herramientas de moderación del servidor')
        .addSubcommand(sub =>
            sub.setName('ban')
                .setDescription('Banea a un usuario del servidor')
                .addUserOption(o => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
                .addStringOption(o => o.setName('razon').setDescription('Razón del baneo').setRequired(false))
                .addIntegerOption(o => o.setName('dias').setDescription('Días de mensajes a eliminar (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('hackban')
                .setDescription('Banea a un usuario por ID aunque no esté en el servidor')
                .addStringOption(o => o.setName('userid').setDescription('ID del usuario a banear').setRequired(true))
                .addStringOption(o => o.setName('razon').setDescription('Razón del baneo').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('unban')
                .setDescription('Desbanea a un usuario por su ID')
                .addStringOption(o => o.setName('userid').setDescription('ID del usuario a desbanear').setRequired(true))
                .addStringOption(o => o.setName('razon').setDescription('Razón del desbaneo').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('silenciar')
                .setDescription('Silencia a un usuario (timeout)')
                .addUserOption(o => o.setName('usuario').setDescription('Usuario a silenciar').setRequired(true))
                .addStringOption(o => o.setName('duracion').setDescription('Duración: 10m, 1h, 1d (máx 28d)').setRequired(false))
                .addStringOption(o => o.setName('razon').setDescription('Razón del silencio').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('desilenciar')
                .setDescription('Quita el silencio (timeout) a un usuario')
                .addUserOption(o => o.setName('usuario').setDescription('Usuario al que quitar el silencio').setRequired(true))
                .addStringOption(o => o.setName('razon').setDescription('Razón del dessilencio').setRequired(false))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const lang = await getLanguage(interaction.guildId);

        if (sub === 'ban') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
                return interaction.reply({ content: t('NO_PERMISSIONS', lang), flags: 64 });
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
                return interaction.reply({ content: t('BOT_NO_PERMISSIONS', lang), flags: 64 });

            const targetUser = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('razon') || t('NO_REASON', lang);
            const dias = interaction.options.getInteger('dias') || 0;

            if (targetUser.id === interaction.user.id)
                return interaction.reply({ content: t('KILL_SELF', lang), flags: 64 });
            if (targetUser.id === PROTECTED_USER_ID)
                return interaction.reply({ content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...', flags: 64 });
            if (targetUser.id === interaction.client.user.id)
                return interaction.reply({ content: t('KILL_BOT', lang), flags: 64 });

            try {
                const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
                if (member) {
                    if (member.roles.highest.position >= interaction.member.roles.highest.position)
                        return interaction.reply({ content: t('HIERARCHY_ERROR', lang), flags: 64 });
                    if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position)
                        return interaction.reply({ content: t('BOT_HIERARCHY_ERROR', lang), flags: 64 });
                }

                await interaction.guild.members.ban(targetUser, {
                    reason: `${reason} | Moderador: ${interaction.user.username}`,
                    deleteMessageSeconds: dias * 86400
                });

                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('<a:tnt:1385229826008289330> ' + t('BAN_TITLE', lang))
                    .setDescription(t('BAN_SUCCESS', lang, { user: targetUser.username }))
                    .addFields(
                        { name: t('REASON', lang), value: reason },
                        { name: t('MODERATOR', lang), value: interaction.user.username, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                const msg = { content: t('IA_ERROR', lang), flags: 64 };
                if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
                else await interaction.reply(msg);
            }
        }

        else if (sub === 'hackban') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
                return interaction.reply({ content: t('NO_PERMISSIONS', lang), flags: 64 });

            const userId = interaction.options.getString('userid').trim();
            const reason = interaction.options.getString('razon') || 'Sin razón especificada';

            if (!/^\d{17,19}$/.test(userId))
                return interaction.reply({ content: '❌ El ID no es válido. Debe tener 17-19 dígitos.', flags: 64 });
            if (userId === PROTECTED_USER_ID)
                return interaction.reply({ content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...', flags: 64 });
            if (userId === interaction.user.id)
                return interaction.reply({ content: '❌ No puedes banearte a ti mismo.', flags: 64 });
            if (userId === interaction.client.user.id)
                return interaction.reply({ content: '❌ No puedo banearme a mí misma.', flags: 64 });
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
                return interaction.reply({ content: '❌ No tengo permisos para banear.', flags: 64 });

            await interaction.deferReply();

            try {
                const bans = await interaction.guild.bans.fetch();
                if (bans.has(userId))
                    return interaction.editReply({ content: `❌ El usuario \`${userId}\` ya está baneado.` });

                await interaction.guild.members.ban(userId, {
                    reason: `${reason} | HackBan por: ${interaction.user.username}`
                });

                let userTag = `ID: \`${userId}\``;
                try { const u = await interaction.client.users.fetch(userId); userTag = `**${u.tag}** (\`${userId}\`)`; } catch {}

                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('<a:tnt:1385229826008289330> HackBan Aplicado')
                    .setDescription(`${userTag} ha sido baneado del servidor.`)
                    .addFields(
                        { name: '📋 Razón', value: reason },
                        { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: '❌ No pude banear al usuario. Verifica el ID.' });
            }
        }

        else if (sub === 'unban') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
                return interaction.reply({ content: t('NO_PERMISSIONS', lang), flags: 64 });
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
                return interaction.reply({ content: '❌ No tengo permisos para desbanear usuarios.', flags: 64 });

            const userId = interaction.options.getString('userid').trim();
            const reason = interaction.options.getString('razon') || 'Sin razón especificada';

            if (!/^\d{17,19}$/.test(userId))
                return interaction.reply({ content: '❌ ID inválido. Debe tener 17-19 dígitos.', flags: 64 });

            await interaction.deferReply();

            try {
                const bans = await interaction.guild.bans.fetch();
                const bannedUser = bans.get(userId);
                if (!bannedUser)
                    return interaction.editReply({ content: `❌ El usuario \`${userId}\` no está baneado en este servidor.` });

                await interaction.guild.members.unban(userId, `${reason} | Moderador: ${interaction.user.username}`);

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('✅ Usuario Desbaneado')
                    .setDescription(`**${bannedUser.user.tag}** ha sido desbaneado del servidor.`)
                    .addFields(
                        { name: '🆔 ID', value: userId, inline: true },
                        { name: '📋 Razón', value: reason },
                        { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                    )
                    .setThumbnail(bannedUser.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: '❌ No pude desbanear al usuario. Verifica el ID.' });
            }
        }

        else if (sub === 'silenciar') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
                return interaction.reply({ content: t('NO_PERMISSIONS', lang), flags: 64 });

            const targetUser = interaction.options.getUser('usuario');
            const duration = interaction.options.getString('duracion') || '10m';
            const reason = interaction.options.getString('razon') || t('NO_REASON', lang);

            if (targetUser.id === interaction.user.id)
                return interaction.reply({ content: t('KILL_SELF', lang), flags: 64 });
            if (targetUser.id === PROTECTED_USER_ID)
                return interaction.reply({ content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...', flags: 64 });

            try {
                const member = interaction.guild.members.cache.get(targetUser.id);
                if (!member)
                    return interaction.reply({ content: t('USER_NOT_FOUND', lang), flags: 64 });

                const durationMs = parseDuration(duration);
                await member.timeout(durationMs, reason);

                const embed = new EmbedBuilder()
                    .setColor('#51cf66')
                    .setTitle('<a:barrier:1385229854353526828> ' + t('MUTE_TITLE', lang))
                    .setDescription(t('MUTE_SUCCESS', lang, { user: targetUser.username }))
                    .addFields(
                        { name: t('REASON', lang), value: reason },
                        { name: '⏱️ Duración', value: duration, inline: true },
                        { name: t('MODERATOR', lang), value: interaction.user.username, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: t('IA_ERROR', lang), flags: 64 }).catch(() => {});
            }
        }

        else if (sub === 'desilenciar') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
                return interaction.reply({ content: t('NO_PERMISSIONS', lang), flags: 64 });
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
                return interaction.reply({ content: '❌ No tengo permisos para gestionar timeouts.', flags: 64 });

            const targetUser = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('razon') || 'Sin razón especificada';

            await interaction.deferReply();

            try {
                const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
                if (!member)
                    return interaction.editReply({ content: t('USER_NOT_FOUND', lang) });
                if (!member.communicationDisabledUntil)
                    return interaction.editReply({ content: `❌ **${targetUser.username}** no está silenciado actualmente.` });

                await member.timeout(null, `${reason} | Moderador: ${interaction.user.username}`);

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('🔊 Silencio Removido')
                    .setDescription(`**${targetUser.username}** puede hablar de nuevo en el servidor.`)
                    .addFields(
                        { name: '📋 Razón', value: reason },
                        { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                    )
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: '❌ No pude quitar el silencio.' }).catch(() => {});
            }
        }
    },
};
