const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('ready', () => {
    console.log(`TEST: Bot conectado como ${client.user.tag}`);
    console.log(`TEST: Servidores: ${client.guilds.cache.size}`);
    
    // Verificar si el bot puede ver comandos
    client.guilds.cache.forEach(guild => {
        console.log(`TEST: Servidor ${guild.name} - Miembros: ${guild.memberCount}`);
        console.log(`TEST: Bot tiene permisos: ${guild.members.me.permissions.toArray()}`);
    });
});

client.on('interactionCreate', (interaction) => {
    console.log(`TEST: INTERACCIÓN RECIBIDA!`);
    console.log(`TEST: Tipo: ${interaction.type}`);
    console.log(`TEST: Usuario: ${interaction.user.tag}`);
    console.log(`TEST: Comando: ${interaction.commandName || 'N/A'}`);
    
    if (interaction.isChatInputCommand()) {
        interaction.reply('TEST: Bot funcionando correctamente!').catch(console.error);
    }
});

client.on('error', (error) => {
    console.error('TEST: Error del cliente:', error);
});

client.login(process.env.DISCORD_TOKEN);