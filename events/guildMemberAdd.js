const { Events, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { getLanguage, t } = require('../utils/i18n');
const { getAntiRaidConfig, registerJoin, clearJoinCache } = require('../utils/antiraid');
const { generateWelcomeImage } = require('../utils/welcomeImage');
const fs = require('fs');
const path = require('path');

// Deduplicación: evita procesar el mismo join dos veces en 10 segundos
const recentJoins = new Map();

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

const RANDOM_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFC300', '#2ECC71', '#1ABC9C',
    '#3498DB', '#9B59B6', '#E91E63', '#00BCD4', '#FF5722',
    '#8BC34A', '#F06292', '#26C6DA', '#AB47BC', '#FF7043',
    '#66BB6A', '#42A5F5', '#EC407A', '#26A69A', '#FFA726'
];

function randomColor() {
    return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // Deduplicación: ignorar si el mismo miembro ya fue procesado recientemente
        const key = `${member.guild.id}:${member.id}`;
        if (recentJoins.has(key)) return;
        recentJoins.set(key, Date.now());
        setTimeout(() => recentJoins.delete(key), 10_000);

        try {
            const guildId = member.guild.id;

            // ── ANTI-RAID ─────────────────────────────────────────────────
            try {
                const raidCfg = await getAntiRaidConfig(guildId);
                if (raidCfg?.enabled) {
                    const joinCount = registerJoin(guildId, raidCfg.timewindow);

                    if (joinCount >= raidCfg.threshold) {
                        clearJoinCache(guildId);

                        const guild   = member.guild;
                        const me      = guild.members.me;
                        const action  = raidCfg.action;

                        // ── Aplicar acción a los miembros recientes ───────
                        let affected = 0;
                        if (action === 'kick' || action === 'ban') {
                            const cutoff = Date.now() - raidCfg.timewindow * 1000 * 2;
                            const recent = guild.members.cache.filter(m =>
                                !m.user.bot &&
                                m.joinedTimestamp && m.joinedTimestamp > cutoff
                            );
                            for (const [, m] of recent) {
                                try {
                                    if (action === 'kick' && me.permissions.has(PermissionFlagsBits.KickMembers)) {
                                        await m.kick('Anti-Raid: entrada masiva detectada');
                                        affected++;
                                    } else if (action === 'ban' && me.permissions.has(PermissionFlagsBits.BanMembers)) {
                                        await m.ban({ reason: 'Anti-Raid: entrada masiva detectada', deleteMessageSeconds: 86400 });
                                        affected++;
                                    }
                                } catch {}
                            }
                        }

                        if (action === 'lockdown' && me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                            const textChannels = guild.channels.cache.filter(ch => ch.type === 0);
                            for (const [, ch] of textChannels) {
                                await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false })
                                    .catch(() => {});
                            }
                        }

                        // ── Alerta en canal de log ─────────────────────────
                        if (raidCfg.log_channel_id) {
                            const logCh = guild.channels.cache.get(raidCfg.log_channel_id);
                            if (logCh) {
                                const actionLabel = { kick: '👢 Expulsados', ban: '🔨 Baneados', lockdown: '🔒 Servidor bloqueado' };
                                await logCh.send({
                                    embeds: [new EmbedBuilder()
                                        .setColor('#ff4757')
                                        .setTitle('🚨 ¡RAID DETECTADO!')
                                        .setDescription(`Se detectaron **${joinCount} entradas** en **${raidCfg.timewindow} segundos**. Se ha aplicado la acción de protección.`)
                                        .addFields(
                                            { name: '⚙️ Acción aplicada', value: actionLabel[action] || action, inline: true },
                                            { name: '👥 Afectados',        value: action === 'lockdown' ? 'Todos los canales' : `${affected} usuarios`, inline: true }
                                        )
                                        .setFooter({ text: 'Soledad ❣ • Anti-Raid' })
                                        .setTimestamp()]
                                }).catch(() => {});
                            }
                        }

                        console.log(`🚨 Anti-Raid activado en ${guild.name}: ${joinCount} entradas en ${raidCfg.timewindow}s → ${action}`);
                    }
                }
            } catch (raidErr) {
                console.error('Error en anti-raid:', raidErr);
            }
            // ─────────────────────────────────────────────────────────────

            const lang = await getLanguage(guildId);

            let welcomeConfig = {};
            if (fs.existsSync(welcomeConfigPath)) {
                try {
                    welcomeConfig = JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8'));
                } catch (e) {}
            }

            const customConfig = welcomeConfig[guildId];

            // Si el welcome está explícitamente desactivado, no hacer nada
            if (customConfig && customConfig.enabled === false) return;

            let channel = null;

            if (customConfig && customConfig.enabled && customConfig.channelId) {
                channel = member.guild.channels.cache.get(customConfig.channelId);
            }

            if (!channel || !channel.permissionsFor(member.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                const welcomeChannels = ['bienvenidas', 'general', 'welcome', 'chat'];
                for (const channelName of welcomeChannels) {
                    channel = member.guild.channels.cache.find(ch =>
                        ch.name.toLowerCase().includes(channelName) &&
                        ch.type === 0 &&
                        ch.permissionsFor(member.guild.members.me).has(['SendMessages', 'EmbedLinks'])
                    );
                    if (channel) break;
                }
            }

            if (!channel) return;

            let welcomeMessage = customConfig?.message || t('MEMBER_JOIN', lang, { user: `<@${member.id}>` });
            welcomeMessage = welcomeMessage
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{server}/g, member.guild.name);

            const embedColor = customConfig?.colorMode === 'random'
                ? randomColor()
                : (customConfig?.color || (member.user.bot ? '#7289da' : (config.colors?.success || '#00ff00')));

            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`<a:welcome:1385228410401325087> ¡Bienvenido a ${member.guild.name}!`)
                .setDescription(welcomeMessage)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(embedColor)
                .addFields(
                    { name: member.user.bot ? '🤖 Bot' : '👤 ' + t('NEW_MEMBER', lang), value: `${member.user.tag}`, inline: true },
                    { name: t('JOINED_AT', lang), value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '🔢 Miembro', value: `#${member.guild.memberCount}`, inline: true }
                )
                .setFooter({
                    text: member.guild.name,
                    iconURL: member.guild.iconURL() || member.client.user.displayAvatarURL()
                })
                .setTimestamp();

            if (customConfig?.imageUrl) {
                welcomeEmbed.setImage(customConfig.imageUrl);
            }

            // ── BIENVENIDA PREMIUM (imagen canvas tipo Koya) ───────────────
            if (customConfig?.premium?.enabled) {
                const prem = customConfig.premium;
                const descMsg = (prem.descMessage || '')
                    .replace(/{user}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name);

                try {
                    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });
                    const imgBuffer = await generateWelcomeImage({
                        username:     member.displayName || member.user.username,
                        avatarUrl,
                        memberCount:  member.guild.memberCount,
                        welcomeColor: prem.welcomeColor,
                        descColor:    prem.descColor,
                        descMessage:  descMsg,
                        bgUrl:        prem.bgUrl,
                    });

                    const file = new AttachmentBuilder(imgBuffer, { name: 'bienvenida.png' });

                    await channel.send({
                        content: `<a:holi:1385228499438145568> ¡Hola ${member}!`,
                        files:   [file],
                        embeds:  [welcomeEmbed]
                    });
                    return;
                } catch (imgErr) {
                    console.error('Error generando imagen premium welcome:', imgErr);
                    // Si falla la imagen, cae al envío normal debajo
                }
            }

            await channel.send({
                content: `<a:holi:1385228499438145568> ¡Hola ${member}!`,
                embeds: [welcomeEmbed]
            });

        } catch (error) {
            console.error('Error en guildMemberAdd:', error);
        }
    },
};
