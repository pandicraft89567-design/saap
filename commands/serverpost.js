const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const axios = require('axios');

async function validateDiscordInvite(url) {
    // Extraer el código del link
    const match = url.match(/discord(?:\.gg|\.com\/invite)\/([a-zA-Z0-9-]+)/);
    if (!match) return { valid: false, reason: 'El enlace no tiene el formato correcto de Discord.' };

    const code = match[1];

    try {
        const res = await axios.get(`https://discord.com/api/v10/invites/${code}`, { timeout: 5000 });
        const data = res.data;

        // Verificar que sea una invitación a un servidor (guild), no a un DM o grupo
        if (!data.guild) {
            return { valid: false, reason: 'El enlace es válido pero no apunta a un servidor de Discord.' };
        }

        return { valid: true, guildName: data.guild.name };
    } catch (e) {
        if (e.response?.status === 404) {
            return { valid: false, reason: 'El enlace de invitación no existe o ya expiró.' };
        }
        return { valid: false, reason: 'No se pudo verificar el enlace. Intenta de nuevo.' };
    }
}

const OWNER_IDS = ['766405066860527688', '738425516155076629'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverpost')
        .setNameLocalizations({ 'en-US': 'serverpost', 'en-GB': 'serverpost' })
        .setDescription('Publica tu servidor en la lista global (Premium)')
        .setDescriptionLocalizations({ 'en-US': 'Publish your server on the global list (Premium)', 'en-GB': 'Publish your server on the global list (Premium)' })
        .addStringOption(option => option.setName('nombre').setNameLocalizations({ 'en-US': 'name', 'en-GB': 'name' }).setDescription('Nombre de tu servidor').setDescriptionLocalizations({ 'en-US': 'Your server name', 'en-GB': 'Your server name' }).setRequired(true))
        .addStringOption(option => option.setName('invitacion').setNameLocalizations({ 'en-US': 'invite', 'en-GB': 'invite' }).setDescription('Enlace de invitación de tu servidor').setDescriptionLocalizations({ 'en-US': 'Your server invite link', 'en-GB': 'Your server invite link' }).setRequired(true))
        .addStringOption(option => option.setName('descripcion').setNameLocalizations({ 'en-US': 'description', 'en-GB': 'description' }).setDescription('Breve descripción de tu servidor').setDescriptionLocalizations({ 'en-US': 'Brief description of your server', 'en-GB': 'Brief description of your server' }).setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        const userId = interaction.user.id;
        const serverName = interaction.options.getString('nombre');
        const inviteUrl = interaction.options.getString('invitacion');
        const description = interaction.options.getString('descripcion');

        try {
            // Verificar premium
            const res = await db.query('SELECT premium_until FROM economy WHERE user_id = $1', [userId]);
            const premiumUntil = res.rows[0]?.premium_until ? new Date(res.rows[0].premium_until) : null;
            const isOwner = OWNER_IDS.includes(userId);
            const isPremium = isOwner || (premiumUntil && premiumUntil > new Date());

            if (!isPremium) {
                return await interaction.editReply({ content: '⭐ Este comando es exclusivo para usuarios **Premium**. Compra tu suscripción en `/shop`.' });
            }

            // Verificar que el link sea una invitación real a un servidor de Discord
            const inviteCheck = await validateDiscordInvite(inviteUrl);
            if (!inviteCheck.valid) {
                return await interaction.editReply({ content: `❌ ${inviteCheck.reason}` });
            }

            // La publicación expira cuando vence el premium (owners: nunca)
            const expiresAt = isOwner ? null : premiumUntil;

            // Verificar si ya tiene un servidor publicado
            const existing = await db.query('SELECT user_id, expires_at FROM server_ads WHERE user_id = $1', [userId]);

            if (existing.rows.length > 0) {
                // Actualizar el existente
                await db.query(
                    'UPDATE server_ads SET server_name = $1, invite_url = $2, description = $3, expires_at = $4, created_at = NOW() WHERE user_id = $5',
                    [serverName, inviteUrl, description, expiresAt, userId]
                );

                const expiryText = isOwner ? '**Permanente** (dueño del bot)' : `\`${premiumUntil.toLocaleDateString()}\``;
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('🔄 Publicación Actualizada')
                        .setDescription(`Tu servidor **${serverName}** ha sido actualizado en la lista.\n📅 Activa hasta: ${expiryText}\n\nUsa \`/join\` para verlo.`)
                        .setColor('#00AAFF')
                        .setTimestamp()]
                });
            }

            // Crear nueva publicación
            await db.query(
                'INSERT INTO server_ads (user_id, server_name, invite_url, description, expires_at) VALUES ($1, $2, $3, $4, $5)',
                [userId, serverName, inviteUrl, description, expiresAt]
            );

            const expiryText = isOwner ? '**Permanente** (dueño del bot)' : `\`${premiumUntil.toLocaleDateString()}\``;
            return await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('🚀 Servidor Publicado')
                    .setDescription(`¡Tu servidor **${serverName}** ya está en la lista global!\n📅 Activa hasta: ${expiryText}\n\nCualquier usuario puede verlo con \`/join\`.`)
                    .setColor('#00FF00')
                    .setTimestamp()]
            });

        } finally {
            await db.end();
        }
    },
};
