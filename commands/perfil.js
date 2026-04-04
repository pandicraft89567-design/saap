const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        .setDescriptionLocalizations({ 'en-US': 'Show the full profile of a user', 'en-GB': 'Show the full profile of a user' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario a consultar (por defecto: tú mismo)')
                .setDescriptionLocalizations({ 'en-US': 'User to look up (default: yourself)', 'en-GB': 'User to look up (default: yourself)' })
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('usuario') || interaction.user;

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();
        let userBio = null;
        try {
            await db.query('ALTER TABLE economy ADD COLUMN IF NOT EXISTS bio TEXT');
            const bioRes = await db.query('SELECT bio FROM economy WHERE user_id = $1', [targetUser.id]);
            userBio = bioRes.rows[0]?.bio || null;
        } catch (_) {
        } finally {
            await db.end();
        }

        // Fetch completo para obtener banner y accentColor
        const fetchedUser = await targetUser.fetch(true).catch(() => targetUser);

        // Obtener el miembro del servidor para presencia, roles y fecha de entrada
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Avatar
        const avatarURL = fetchedUser.displayAvatarURL({ size: 4096, dynamic: true });

        // Banner (null si el usuario no tiene)
        const bannerURL = fetchedUser.bannerURL({ size: 4096, dynamic: true }) ?? null;

        // Estado de presencia (requiere intent GuildPresences; si no está, muestra desconocido)
        const status = member?.presence?.status;
        const statusText = STATUS_EMOJI[status] || '❓ Desconocido';

        // Fecha de creación de la cuenta
        const createdAt = Math.floor(fetchedUser.createdTimestamp / 1000);

        // Fecha de entrada al servidor
        const joinedAt = member?.joinedTimestamp
            ? Math.floor(member.joinedTimestamp / 1000)
            : null;

        // Color de acento del perfil
        const accentColor = fetchedUser.accentColor
            ? `#${fetchedUser.accentColor.toString(16).padStart(6, '0').toUpperCase()}`
            : null;

        // Roles (sin @everyone)
        const roles = member
            ? member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => `${r}`)
                .slice(0, 10)
            : [];

        const embed = new EmbedBuilder()
            .setColor(fetchedUser.accentColor ?? 0xFF69B4)
            .setTitle(`${fetchedUser.globalName ?? fetchedUser.username}`)
            .setThumbnail(avatarURL)
            .addFields(
                {
                    name: '🏷️ Usuario',
                    value: `${fetchedUser.tag}`,
                    inline: true
                },
                {
                    name: '🆔 ID',
                    value: fetchedUser.id,
                    inline: true
                },
                {
                    name: '📶 Estado',
                    value: statusText,
                    inline: true
                },
                {
                    name: '📅 Cuenta creada',
                    value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`,
                    inline: false
                },
            );

        if (joinedAt) {
            embed.addFields({
                name: '📥 Entró al servidor',
                value: `<t:${joinedAt}:D> (<t:${joinedAt}:R>)`,
                inline: false
            });
        }

        if (accentColor) {
            embed.addFields({
                name: '🎨 Color de perfil',
                value: accentColor,
                inline: true
            });
        }

        if (roles.length > 0) {
            embed.addFields({
                name: `🏅 Roles (${member.roles.cache.size - 1})`,
                value: roles.join(' ') || 'Ninguno',
                inline: false
            });
        }

        if (userBio) {
            embed.addFields({
                name: '📝 Bio Premium',
                value: userBio,
                inline: false
            });
        }

        // Enlace a la foto y al banner
        const links = [`[🖼️ Ver foto de perfil](${avatarURL})`];
        if (bannerURL) links.push(`[🏳️ Ver banner](${bannerURL})`);
        embed.addFields({ name: '🔗 Enlaces', value: links.join('  •  '), inline: false });

        embed.setFooter({ text: 'Soledad ❣ • Perfil' }).setTimestamp();

        // Si tiene banner, lo muestra como imagen grande debajo del embed
        if (bannerURL) embed.setImage(bannerURL);

        await interaction.editReply({ embeds: [embed] });
    }
};
