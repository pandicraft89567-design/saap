const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { Client } = require('pg');

const STATUS_EMOJI = {
    online: '🟢 En línea',
    idle: '🌙 Ausente',
    dnd: '🔴 No molestar',
    offline: '⚫ Desconectado',
    invisible: '⚫ Desconectado',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setNameLocalizations({ 'en-US': 'profile', 'en-GB': 'profile' })
        .setDescription('Muestra el perfil completo de un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a consultar')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('usuario') || interaction.user;

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        let userBio = null;
        try {
            await db.query('ALTER TABLE economy ADD COLUMN IF NOT EXISTS bio TEXT');
            const res = await db.query('SELECT bio FROM economy WHERE user_id = $1', [targetUser.id]);
            userBio = res.rows[0]?.bio || null;
        } catch (_) {} 
        finally { await db.end(); }

        const fetchedUser = await targetUser.fetch(true).catch(() => targetUser);
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const avatarURL = fetchedUser.displayAvatarURL({ size: 4096, dynamic: true });
        const bannerURL = fetchedUser.bannerURL({ size: 4096, dynamic: true }) ?? null;

        // =========================
        // 🔥 ESTADO + ACTIVIDAD
        // =========================
        let statusText = '⚫ Desconectado';
        let activityText = 'Sin actividad';

        if (member?.presence) {

            const status = member.presence.status;
            statusText = STATUS_EMOJI[status] || '⚫ Desconectado';

            const activities = member.presence.activities;

            if (activities.length > 0) {

                const act = activities[0];

                switch (act.type) {

                    case ActivityType.Playing:
                        activityText = `🎮 Jugando a **${act.name}**`;
                        break;

                    case ActivityType.Streaming:
                        activityText = `📺 Transmitiendo **${act.name}**`;
                        break;

                    case ActivityType.Listening:
                        if (act.name === 'Spotify') {
                            activityText = `🎵 Escuchando **${act.details}** — ${act.state}`;
                        } else {
                            activityText = `🎧 Escuchando **${act.name}**`;
                        }
                        break;

                    case ActivityType.Watching:
                        activityText = `📺 Viendo **${act.name}**`;
                        break;

                    case ActivityType.Custom:
                        activityText = `💬 ${act.state || 'Estado personalizado'}`;
                        break;

                    default:
                        activityText = `📌 ${act.name}`;
                }
            }
        }

        // =========================

        const createdAt = Math.floor(fetchedUser.createdTimestamp / 1000);

        const joinedAt = member?.joinedTimestamp
            ? Math.floor(member.joinedTimestamp / 1000)
            : null;

        const accentColor = fetchedUser.accentColor
            ? `#${fetchedUser.accentColor.toString(16).padStart(6, '0').toUpperCase()}`
            : null;

        // 🔥 SOLO CONTAR ROLES
        const rolesCount = member
            ? member.roles.cache.filter(r => r.id !== interaction.guild.id).size
            : 0;

        const embed = new EmbedBuilder()
            .setColor(fetchedUser.accentColor ?? 0xFF69B4)
            .setTitle(`${fetchedUser.globalName ?? fetchedUser.username}`)
            .setThumbnail(avatarURL)
            .addFields(
                { name: '🏷️ Usuario', value: fetchedUser.tag, inline: true },
                { name: '🆔 ID', value: fetchedUser.id, inline: true },
                { name: '📶 Estado', value: statusText, inline: true },
                { name: '🎯 Actividad', value: activityText, inline: true },
                { name: '🏅 Roles', value: rolesCount > 0 ? `🎖️ ${rolesCount} roles` : 'Sin roles', inline: true },
                {
                    name: '📅 Cuenta creada',
                    value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`,
                },
            );

        if (joinedAt) {
            embed.addFields({
                name: '📥 Entró al servidor',
                value: `<t:${joinedAt}:D> (<t:${joinedAt}:R>)`,
            });
        }

        if (accentColor) {
            embed.addFields({
                name: '🎨 Color de perfil',
                value: accentColor,
                inline: true
            });
        }

        if (userBio) {
            embed.addFields({
                name: '📝 Bio Premium',
                value: userBio
            });
        }

        const links = [`[🖼️ Ver avatar](${avatarURL})`];
        if (bannerURL) links.push(`[🏳️ Ver banner](${bannerURL})`);

        embed.addFields({
            name: '🔗 Enlaces',
            value: links.join('  •  ')
        });

        embed.setFooter({ text: 'Soledad ❣ • Perfil' }).setTimestamp();

        if (bannerURL) embed.setImage(bannerURL);

        await interaction.editReply({ embeds: [embed] });
    }
};
