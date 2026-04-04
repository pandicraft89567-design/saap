const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        console.log(`📤 Bot removido del servidor: ${guild.name} (${guild.memberCount} miembros)`);
        
        // Actualizar estados dinámicos
        if (guild.client.statusManager) {
            guild.client.statusManager.onGuildUpdate();
        }
        
        // Log de estadísticas
        const totalGuilds = guild.client.guilds.cache.size;
        const totalUsers = guild.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        console.log(`📊 Estadísticas actualizadas: ${totalGuilds} servidores, ${totalUsers} usuarios`);
    },
};