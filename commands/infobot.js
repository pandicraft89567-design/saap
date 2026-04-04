const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const SUPPORT_SERVER = 'https://discord.gg/vF237WtTq6';

// Para verificación: Discord exige verificar el bot a partir de 75 servidores.
// Sin verificación, el bot no puede unirse a más de 100 servidores.
const VERIFY_THRESHOLD = 75;
const MAX_UNVERIFIED = 100;

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infobot')
        .setNameLocalizations({ 'en-US': 'botinfo', 'en-GB': 'botinfo' })
        .setDescription('Muestra información detallada sobre Soledad')
        .setDescriptionLocalizations({ 'en-US': 'Show detailed information about Soledad', 'en-GB': 'Show detailed information about Soledad' }),

    async execute(interaction) {
        await interaction.deferReply();

        const client = interaction.client;
        const bot = client.user;

        const guildCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const commandCount = client.commands?.size || 0;
        const uptime = formatUptime(client.uptime);
        const createdAt = Math.floor(bot.createdTimestamp / 1000);
        const ping = client.ws.ping;

        // Cálculo de servidores para verificación
        const serversToVerify = Math.max(0, VERIFY_THRESHOLD - guildCount);
        const serversToMax = Math.max(0, MAX_UNVERIFIED - guildCount);
        const isVerified = guildCount >= VERIFY_THRESHOLD;

        let verifyText;
        if (guildCount >= MAX_UNVERIFIED) {
            verifyText = '✅ Bot verificado (límite sin verificación superado)';
        } else if (guildCount >= VERIFY_THRESHOLD) {
            verifyText = `⚠️ Verificación **requerida** · Faltan verificar (${serversToMax} para el límite)`;
        } else {
            verifyText = `📋 Faltan **${serversToVerify}** servidores para requerir verificación\n🔒 Faltan **${serversToMax}** para el límite sin verificar`;
        }

        // Barra de progreso visual hacia la verificación
        const progress = Math.min(guildCount, VERIFY_THRESHOLD);
        const filled = Math.round((progress / VERIFY_THRESHOLD) * 10);
        const empty = 10 - filled;
        const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
        const percent = Math.min(100, Math.round((guildCount / VERIFY_THRESHOLD) * 100));

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`${bot.username} · Información del Bot`)
            .setThumbnail(bot.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '🤖 General',
                    value: [
                        `**Nombre:** ${bot.tag}`,
                        `**ID:** \`${bot.id}\``,
                        `**Creado:** <t:${createdAt}:D> (<t:${createdAt}:R>)`,
                        `**Ping:** \`${ping}ms\``,
                        `**Tiempo activo:** \`${uptime}\``,
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📊 Estadísticas',
                    value: [
                        `**Servidores:** \`${guildCount}\``,
                        `**Usuarios:** \`${userCount.toLocaleString()}\``,
                        `**Comandos:** \`${commandCount}\``,
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🛠️ Tecnología',
                    value: [
                        `**Librería:** \`discord.js v14\``,
                        `**Node.js:** \`${process.version}\``,
                        `**Memoria:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB\``,
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏅 Verificación de Discord',
                    value: [
                        verifyText,
                        `\`${progressBar}\` ${percent}% (${guildCount}/${VERIFY_THRESHOLD})`,
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({
                text: 'Soledad ❣ · Hecha con amor',
                iconURL: bot.displayAvatarURL()
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 Servidor Oficial')
                .setURL(SUPPORT_SERVER)
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('➕ Invitar a Soledad')
                .setURL(`https://discord.com/oauth2/authorize?client_id=${bot.id}&permissions=8&scope=bot%20applications.commands`)
                .setStyle(ButtonStyle.Link)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
