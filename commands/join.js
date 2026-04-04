const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Client } = require('pg');

async function getActiveAds(db) {
    const res = await db.query(
        `SELECT * FROM server_ads 
         WHERE expires_at IS NULL OR expires_at > NOW()
         ORDER BY created_at DESC`
    );
    return res.rows;
}

function buildJoinEmbed(ad, page, total) {
    const expiryText = ad.expires_at
        ? `<t:${Math.floor(new Date(ad.expires_at).getTime() / 1000)}:R>`
        : '✨ Permanente';

    return new EmbedBuilder()
        .setTitle(`🌟 ${ad.server_name || 'Servidor Destacado'}`)
        .setDescription(ad.description)
        .setColor('#FFD700')
        .addFields(
            { name: '⏳ Expira', value: expiryText, inline: true },
            { name: '📅 Publicado', value: `<t:${Math.floor(new Date(ad.created_at).getTime() / 1000)}:D>`, inline: true }
        )
        .setFooter({ text: `Página ${page + 1} de ${total} • Servidores destacados Premium` })
        .setTimestamp();
}

function buildNavButtons(page, total, ad) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`join_page_${page - 1}`)
            .setLabel('◀ Anterior')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setLabel('🔗 Unirse')
            .setURL(ad.invite_url)
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setCustomId(`join_page_${page + 1}`)
            .setLabel('Siguiente ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= total - 1)
    );
    return [row];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setNameLocalizations({ 'en-US': 'join', 'en-GB': 'join' })
        .setDescription('Explora y únete a servidores destacados por usuarios Premium')
        .setDescriptionLocalizations({ 'en-US': 'Explore and join featured servers by Premium users', 'en-GB': 'Explore and join featured servers by Premium users' }),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            const ads = await getActiveAds(db);

            if (ads.length === 0) {
                return await interaction.editReply({ content: '📭 Aún no hay servidores destacados. ¡Sé el primero con `/serverpost`!' });
            }

            const ad = ads[0];
            return await interaction.editReply({
                embeds: [buildJoinEmbed(ad, 0, ads.length)],
                components: buildNavButtons(0, ads.length, ad)
            });

        } finally {
            await db.end();
        }
    },

    // Función para manejar la paginación desde interactionCreate
    async handlePage(interaction, page) {
        await interaction.deferUpdate();

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            const ads = await getActiveAds(db);

            if (ads.length === 0) {
                return await interaction.editReply({ content: '📭 Ya no hay servidores activos.', components: [] });
            }

            const clampedPage = Math.max(0, Math.min(page, ads.length - 1));
            const ad = ads[clampedPage];

            return await interaction.editReply({
                embeds: [buildJoinEmbed(ad, clampedPage, ads.length)],
                components: buildNavButtons(clampedPage, ads.length, ad)
            });

        } finally {
            await db.end();
        }
    }
};
