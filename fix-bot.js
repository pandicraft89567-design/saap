const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Comando simple para prueba
const testCommand = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Comando de prueba para verificar funcionamiento');

client.on('ready', async () => {
    console.log(`FIX: Bot conectado como ${client.user.tag}`);
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('FIX: Registrando comando /test...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [testCommand] }
        );
        console.log('FIX: ✅ Comando /test registrado globalmente');
        
        // También registrar comandos del bot principal
        const memeCommand = new SlashCommandBuilder()
            .setName('meme')
            .setDescription('Obtiene un meme aleatorio');
            
        const pingCommand = new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Responde con pong');
            
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [testCommand, memeCommand, pingCommand] }
        );
        console.log('FIX: ✅ Todos los comandos registrados');
        
    } catch (error) {
        console.error('FIX: Error registrando comandos:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    console.log('FIX: ¡INTERACCIÓN RECIBIDA!');
    console.log(`FIX: Usuario: ${interaction.user.tag}`);
    console.log(`FIX: Comando: ${interaction.commandName}`);
    
    if (!interaction.isChatInputCommand()) return;
    
    try {
        if (interaction.commandName === 'test') {
            await interaction.reply('¡El bot funciona perfectamente! 🎉');
            console.log('FIX: ✅ Comando test ejecutado');
        } else if (interaction.commandName === 'ping') {
            await interaction.reply('¡Pong! 🏓');
            console.log('FIX: ✅ Comando ping ejecutado');
        } else if (interaction.commandName === 'meme') {
            await interaction.reply('¡Aquí tienes tu meme! (comando funcionando)');
            console.log('FIX: ✅ Comando meme ejecutado');
        }
    } catch (error) {
        console.error('FIX: Error ejecutando comando:', error);
    }
});

client.on('error', error => {
    console.error('FIX: Error del cliente:', error);
});

console.log('FIX: Iniciando bot reparado...');
client.login(process.env.DISCORD_TOKEN);