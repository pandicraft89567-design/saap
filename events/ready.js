const { Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const StatusManager = require('../utils/statusManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🚀 ¡Bot iniciado como ${client.user.tag}!`);
        
        // Inicializar el sistema de estado dinámico
        client.statusManager = new StatusManager(client);
        client.statusManager.initialize();

        // Registrar comandos slash globalmente
        const commands = [];
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                // Registrar comando principal
                commands.push(command.data.toJSON());
                
                // Si tiene un alias, registrarlo como un comando independiente
                if (command.alias) {
                    const aliasData = JSON.parse(JSON.stringify(command.data.toJSON()));
                    aliasData.name = command.alias;
                    commands.push(aliasData);
                }
            }
        }

        const rest = new REST({ version: '10' }).setToken(config.token);

        try {
            console.log(`🔄 Registrando ${commands.length} comandos slash globalmente (limpiando comandos viejos)...`);

            // Obtener los comandos existentes para conservar los Entry Point (tipo 4) que Discord no permite eliminar
            const existingCommands = await rest.get(Routes.applicationCommands(client.user.id));
            const entryPoints = existingCommands.filter(cmd => cmd.type === 4);
            const finalCommands = [...commands, ...entryPoints];

            // PUT reemplaza TODOS los comandos globales de una vez, eliminando los que ya no existen
            const registeredCommands = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: finalCommands },
            );

            // Guardar IDs para menciones clicables </cmd:id>
            client.commandIds = new Map(registeredCommands.map(cmd => [cmd.name, cmd.id]));

            console.log(`✅ Registro global completado! ${commands.length} comandos activos.`);

            // Limpiar comandos de guild para evitar duplicados (los comandos globales son suficientes)
            const cleanupPromises = client.guilds.cache.map(guild =>
                rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: [] }
                ).catch(() => {})
            );
            await Promise.allSettled(cleanupPromises);
            console.log(`✅ Comandos de servidor limpiados (sin duplicados).`);
        } catch (error) {
            console.error('❌ Error general de registro:', error);
        }

        console.log(`📊 Bot conectado a ${client.guilds.cache.size} servidores`);
        console.log(`👥 Sirviendo a ${client.users.cache.size} usuarios`);
        
        // Verificar permisos en el servidor
        if (client.guilds.cache.size > 0) {
            const guild = client.guilds.cache.first();
            const botMember = guild.members.me;
            console.log(`🔍 Permisos del bot en ${guild.name}:`);
            console.log(`   - Enviar mensajes: ${botMember.permissions.has('SendMessages')}`);
            console.log(`   - Usar comandos slash: ${botMember.permissions.has('UseApplicationCommands')}`);
            console.log(`   - Embeds: ${botMember.permissions.has('EmbedLinks')}`);
        }
    },
};
