const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('ready', () => {
    console.log(`DEBUG: Bot conectado como ${client.user.tag}`);
    console.log(`DEBUG: ID del bot: ${client.user.id}`);
    console.log(`DEBUG: Client ID desde env: ${process.env.CLIENT_ID}`);
    
    // Generar enlace de invitación correcto
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=2147483647&scope=bot%20applications.commands`;
    console.log(`DEBUG: Enlace de invitación:`);
    console.log(inviteUrl);
    
    console.log(`DEBUG: Para usar comandos slash, asegúrate de que el bot fue invitado con este enlace exacto.`);
});

client.login(process.env.DISCORD_TOKEN);