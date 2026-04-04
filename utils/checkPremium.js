const { Client } = require('pg');

const OWNER_IDS = ['766405066860527688', '738425516155076629'];

async function isPremium(userId) {
    if (OWNER_IDS.includes(userId)) return true;

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    try {
        const res = await db.query(
            'SELECT premium_until FROM economy WHERE user_id = $1',
            [userId]
        );

        if (!res.rows.length || !res.rows[0].premium_until) return false;

        return new Date(res.rows[0].premium_until) > new Date();
    } finally {
        await db.end();
    }
}

function premiumDenied(interaction) {
    return interaction.reply({
        embeds: [{
            color: 0x00FFFF,
            title: '<a:lux:1385222769566027836> Comando Exclusivo Premium',
            description: '**Este comando es exclusivo para usuarios Premium.**\n\nContacta a un administrador para obtener acceso Premium y desbloquear:\n> 🎨 Imágenes generadas con IA\n> 💸 Transferir Solecoins\n> 🌟 Daily con 3× recompensa\n> 📝 Bio personalizada en tu perfil\n> 📋 Auditoría del servidor',
            footer: { text: 'Soledad ❣ Premium' },
            timestamp: new Date().toISOString()
        }],
        ephemeral: true
    });
}

module.exports = { isPremium, premiumDenied, OWNER_IDS };
