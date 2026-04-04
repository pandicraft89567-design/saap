const { Client, GatewayIntentBits } = require('discord.js');

console.log('Probando nueva aplicación Discord...');

// Usar los nuevos tokens si están disponibles
const token = process.env.NEW_DISCORD_TOKEN || process.env.DISCORD_TOKEN;
const clientId = process.env.NEW_CLIENT_ID || process.env.CLIENT_ID;

console.log(`Token disponible: ${token ? 'SÍ' : 'NO'}`);
console.log(`Client ID: ${clientId}`);

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('ready', () => {
    console.log(`NUEVA APP: Bot conectado como ${client.user.tag}`);
    console.log(`NUEVA APP: ID: ${client.user.id}`);
    console.log(`NUEVA APP: Enlace de invitación:`);
    console.log(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=2147483647&scope=bot%20applications.commands`);
});

client.on('interactionCreate', (interaction) => {
    console.log(`NUEVA APP: ¡Interacción recibida de ${interaction.user.tag}!`);
    console.log(`NUEVA APP: Comando: ${interaction.commandName}`);
});

client.on('error', error => {
    console.error('NUEVA APP: Error:', error);
});

client.login(token).catch(error => {
    console.error('NUEVA APP: Error de login:', error);
});