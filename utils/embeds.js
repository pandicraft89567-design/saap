const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Crear un embed de error estandarizado
 * @param {string} message - Mensaje de error
 * @param {string} title - Título del error (opcional)
 * @returns {EmbedBuilder} Embed de error
 */
function createErrorEmbed(message, title = '❌ Error') {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(config.colors.error)
        .setTimestamp();
}

/**
 * Crear un embed de éxito estandarizado
 * @param {string} message - Mensaje de éxito
 * @param {string} title - Título del éxito (opcional)
 * @returns {EmbedBuilder} Embed de éxito
 */
function createSuccessEmbed(message, title = '✅ Éxito') {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(config.colors.success)
        .setTimestamp();
}

/**
 * Crear un embed de advertencia estandarizado
 * @param {string} message - Mensaje de advertencia
 * @param {string} title - Título de la advertencia (opcional)
 * @returns {EmbedBuilder} Embed de advertencia
 */
function createWarningEmbed(message, title = '⚠️ Advertencia') {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(config.colors.warning)
        .setTimestamp();
}

/**
 * Crear un embed de información estandarizado
 * @param {string} message - Mensaje de información
 * @param {string} title - Título de la información (opcional)
 * @returns {EmbedBuilder} Embed de información
 */
function createInfoEmbed(message, title = 'ℹ️ Información') {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(config.colors.primary)
        .setTimestamp();
}

/**
 * Crear un embed personalizado para comandos específicos
 * @param {Object} options - Opciones del embed
 * @param {string} options.title - Título del embed
 * @param {string} options.description - Descripción del embed
 * @param {string} options.color - Color del embed
 * @param {Array} options.fields - Campos del embed
 * @param {string} options.image - URL de imagen
 * @param {string} options.thumbnail - URL de thumbnail
 * @param {Object} options.footer - Objeto footer
 * @param {boolean} options.timestamp - Si incluir timestamp
 * @returns {EmbedBuilder} Embed personalizado
 */
function createCustomEmbed(options) {
    const embed = new EmbedBuilder();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.color) embed.setColor(options.color);
    if (options.fields && Array.isArray(options.fields)) {
        embed.addFields(...options.fields);
    }
    if (options.image) embed.setImage(options.image);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.footer) embed.setFooter(options.footer);
    if (options.timestamp) embed.setTimestamp();

    return embed;
}

/**
 * Crear un embed para mostrar estadísticas del bot
 * @param {Client} client - Cliente de Discord
 * @returns {EmbedBuilder} Embed de estadísticas
 */
function createStatsEmbed(client) {
    const embed = new EmbedBuilder()
        .setTitle('📊 Estadísticas del Bot')
        .setColor(config.colors.primary)
        .addFields(
            { name: '🏠 Servidores', value: client.guilds.cache.size.toString(), inline: true },
            { name: '👥 Usuarios', value: client.users.cache.size.toString(), inline: true },
            { name: '📺 Canales', value: client.channels.cache.size.toString(), inline: true },
            { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
            { name: '⏱️ Uptime', value: formatUptime(client.uptime), inline: true },
            { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
        )
        .setTimestamp();

    return embed;
}

/**
 * Formatear tiempo de actividad
 * @param {number} uptime - Tiempo en milisegundos
 * @returns {string} Tiempo formateado
 */
function formatUptime(uptime) {
    const seconds = Math.floor((uptime / 1000) % 60);
    const minutes = Math.floor((uptime / (1000 * 60)) % 60);
    const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

module.exports = {
    createErrorEmbed,
    createSuccessEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createCustomEmbed,
    createStatsEmbed,
    formatUptime
};
