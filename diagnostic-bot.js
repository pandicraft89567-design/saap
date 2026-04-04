const { Client, GatewayIntentBits } = require('discord.js');

console.log('DIAGNÓSTICO: Iniciando bot de diagnóstico...');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Evento básico de conexión
client.on('ready', () => {
    console.log(`DIAGNÓSTICO: Bot conectado como ${client.user.tag}`);
    console.log(`DIAGNÓSTICO: ID del cliente: ${client.user.id}`);
    console.log(`DIAGNÓSTICO: Token válido: ${process.env.DISCORD_TOKEN ? 'SÍ' : 'NO'}`);
});

// Evento de interacción crudo
client.on('raw', (packet) => {
    if (packet.t === 'INTERACTION_CREATE') {
        console.log('DIAGNÓSTICO: ¡INTERACCIÓN CRUDA DETECTADA!');
        console.log(`DIAGNÓSTICO: Tipo: ${packet.d.type}`);
        console.log(`DIAGNÓSTICO: Nombre: ${packet.d.data?.name || 'N/A'}`);
    }
});

// Evento de interacción procesada
client.on('interactionCreate', (interaction) => {
    console.log('DIAGNÓSTICO: ¡EVENTO INTERACTIONCREATE ACTIVADO!');
    console.log(`DIAGNÓSTICO: Tipo de interacción: ${interaction.type}`);
    console.log(`DIAGNÓSTICO: Es comando: ${interaction.isChatInputCommand()}`);
    if (interaction.isChatInputCommand()) {
        console.log(`DIAGNÓSTICO: Comando: ${interaction.commandName}`);
    }
});

// Errores
client.on('error', (error) => {
    console.error('DIAGNÓSTICO: Error del cliente:', error);
});

client.on('shardError', (error) => {
    console.error('DIAGNÓSTICO: Error de shard:', error);
});

client.on('warn', (warning) => {
    console.warn('DIAGNÓSTICO: Advertencia:', warning);
});

console.log('DIAGNÓSTICO: Intentando conectar...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('DIAGNÓSTICO: Error de login:', error);
});