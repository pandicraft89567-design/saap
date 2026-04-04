const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
    console.log(`SIMPLE: Bot listo como ${client.user.tag}`);
    
    // Registrar un comando simple
    const commands = [
        new SlashCommandBuilder()
            .setName('test')
            .setDescription('Comando de prueba simple')
    ];

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('SIMPLE: Comando /test registrado');
    } catch (error) {
        console.error('SIMPLE: Error registrando comando:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    console.log(`SIMPLE: INTERACCIÓN DETECTADA!`);
    console.log(`SIMPLE: Tipo: ${interaction.type}`);
    console.log(`SIMPLE: Usuario: ${interaction.user.tag}`);
    
    if (interaction.isChatInputCommand() && interaction.commandName === 'test') {
        console.log(`SIMPLE: Respondiendo al comando test`);
        try {
            await interaction.reply('¡Funciona! El bot recibe comandos correctamente.');
            console.log(`SIMPLE: Respuesta enviada exitosamente`);
        } catch (error) {
            console.error(`SIMPLE: Error en respuesta:`, error);
        }
    }
});

client.on('error', error => {
    console.error('SIMPLE: Error del cliente:', error);
});

console.log('SIMPLE: Iniciando bot...');
client.login(process.env.DISCORD_TOKEN);