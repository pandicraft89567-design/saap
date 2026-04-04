const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage } = require('../utils/i18n');

const ALL_COMMANDS = {
    '🌸 Social & Diversión': [
        { name: '/beso', usage: '/beso usuario:@usuario', desc: 'Dale un beso virtual a alguien con un GIF de anime.' },
        { name: '/abrazo', usage: '/abrazo usuario:@usuario', desc: 'Dale un abrazo virtual a alguien con un GIF de anime.' },
        { name: '/matar', usage: '/matar usuario:@usuario', desc: 'Elimina a un usuario de manera divertida.' },
        { name: '/megusta', usage: '/megusta persona:@usuario', desc: 'Dedícale un poema especial a alguien que te gusta.' },
        { name: '/tuitear', usage: '/tuitear mensaje:texto [usuario:@usuario] [nombre_cuenta:texto] [usuario_cuenta:texto]', desc: 'Crea un tweet con formato de Twitter.' },
        { name: '/mood', usage: '/mood energia:opción', desc: 'Genera una paleta de colores y estado de ánimo basado en tu energía actual.' },
        { name: '/8ball', usage: '/8ball pregunta:texto', desc: 'Hace una pregunta a la bola mágica 8.' },
        { name: '/poll', usage: '/poll pregunta:texto opciones:texto', desc: 'Crea una encuesta para el servidor.' },
        { name: '/coinflip', usage: '/coinflip', desc: 'Lanza una moneda al aire (cara o cruz).' },
    ],
    '🎨 Anime & Medios': [
        { name: '/anime', usage: '/anime tipo:opción [usuario:@usuario]', desc: 'Obtén imágenes o GIFs de anime. Tipos: waifu, sonrisa, saludo, dormir, celebrar, llorar, pensar, comer.' },
        { name: '/meme', usage: '/meme', desc: 'Obtén un meme aleatorio.' },
        { name: '/avatar', usage: '/avatar [usuario:@usuario]', desc: 'Muestra el avatar de un usuario en alta resolución.' },
        { name: '/effect', usage: '/effect tipo:opción [usuario:@usuario]', desc: 'Aplica un efecto visual al avatar. Tipos: posterizar, brillo, contraste, dither.' },
        { name: '/filter', usage: '/filter tipo:opción [usuario:@usuario]', desc: 'Aplica un filtro al avatar. Tipos: gris, invertir, sepia, blur, pixelar.' },
        { name: '/tuitear', usage: '/tuitear mensaje:texto', desc: 'Crea un tweet con formato visual de Twitter.' },
    ],
    '🤖 Inteligencia Artificial': [
        { name: '/ia', usage: '/ia mensaje:texto', desc: 'Chatea con la inteligencia artificial del bot.' },
    ],
    '🎵 Música & Entretenimiento': [
        { name: '/yt', usage: '/yt busqueda:texto', desc: 'Busca y reproduce videos de YouTube.' },
        { name: '/minecraft', usage: '/minecraft servidor:ip', desc: 'Consulta el estado de un servidor de Minecraft.' },
        { name: '/roblox', usage: '/roblox usuario:nombre', desc: 'Consulta información de un usuario de Roblox.' },
    ],
    '💰 Economía': [
        { name: '/economy', usage: '/economy', desc: 'Consulta tu saldo y estadísticas de economía.' },
        { name: '/shop', usage: '/shop', desc: 'Abre la tienda del servidor.' },
        { name: '/premium', usage: '/premium', desc: 'Consulta y gestiona el plan premium.' },
    ],
    '🔧 Utilidades': [
        { name: '/ping', usage: '/ping', desc: 'Muestra la latencia del bot.' },
        { name: '/stats', usage: '/stats', desc: 'Muestra las estadísticas del bot.' },
        { name: '/userinfo', usage: '/userinfo [usuario:@usuario]', desc: 'Muestra información detallada de un usuario.' },
        { name: '/serverinfo', usage: '/serverinfo', desc: 'Muestra información del servidor.' },
        { name: '/language', usage: '/language idioma:opción', desc: 'Cambia el idioma del bot (español/inglés).' },
        { name: '/join', usage: '/join', desc: 'Únete al servidor oficial.' },
        { name: '/ayuda', usage: '/ayuda [categoria:opción]', desc: 'Muestra todos los comandos disponibles.' },
        { name: '/info', usage: '/info [comando:nombre]', desc: 'Muestra información detallada de un comando específico o de todos.' },
    ],
    '🛡️ Moderación': [
        { name: '/ban', usage: '/ban usuario:@usuario [razon:texto] [dias:número]', desc: 'Banea a un usuario del servidor.' },
        { name: '/silenciar', usage: '/silenciar usuario:@usuario [duracion:tiempo] [razon:texto] [canal:#canal]', desc: 'Silencia a un usuario en canales de texto.' },
        { name: '/clear', usage: '/clear cantidad:número', desc: 'Elimina una cantidad de mensajes del canal.' },
        { name: '/slowmode', usage: '/slowmode segundos:número', desc: 'Activa o desactiva el modo lento en el canal.' },
        { name: '/role', usage: '/role usuario:@usuario rol:@rol', desc: 'Asigna o quita un rol a un usuario.' },
        { name: '/md', usage: '/md usuario:@usuario mensaje:texto [anonimo:true/false]', desc: 'Envía un mensaje privado a un usuario.' },
        { name: '/send', usage: '/send canal:#canal mensaje:texto', desc: 'Envía un mensaje a un canal como el bot.' },
    ],
    '⚙️ Configuración': [
        { name: '/welcomeset', usage: '/welcomeset canal:#canal', desc: 'Configura el canal donde se enviarán los mensajes de bienvenida.' },
        { name: '/welcomeconfig', usage: '/welcomeconfig', desc: 'Configura el mensaje y opciones de bienvenida.' },
        { name: '/welcometest', usage: '/welcometest', desc: 'Prueba el mensaje de bienvenida configurado.' },
    ],
};

const COMMAND_LOOKUP = {};
for (const [category, cmds] of Object.entries(ALL_COMMANDS)) {
    for (const cmd of cmds) {
        const key = cmd.name.replace('/', '');
        if (!COMMAND_LOOKUP[key]) COMMAND_LOOKUP[key] = { ...cmd, category };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setNameLocalizations({ 'en-US': 'info', 'en-GB': 'info' })
        .setDescription('Información detallada de los comandos del bot')
        .setDescriptionLocalizations({ 'en-US': 'Detailed information about bot commands', 'en-GB': 'Detailed information about bot commands' })
        .addStringOption(option =>
            option.setName('comando')
                .setNameLocalizations({ 'en-US': 'command', 'en-GB': 'command' })
                .setDescription('Nombre del comando (opcional, sin /) — si no pones nada, se muestran todos')
                .setDescriptionLocalizations({ 'en-US': 'Command name (optional, without /) — if empty, all are shown', 'en-GB': 'Command name (optional, without /) — if empty, all are shown' })
                .setRequired(false)),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const input = interaction.options.getString('comando');

        if (input) {
            const key = input.toLowerCase().replace('/', '');
            const cmd = COMMAND_LOOKUP[key];

            if (!cmd) {
                return await interaction.reply({
                    content: lang === 'es'
                        ? `❌ No encontré información del comando \`/${key}\`. Usa \`/info\` sin argumentos para ver todos los comandos.`
                        : `❌ Command \`/${key}\` not found. Use \`/info\` without arguments to see all commands.`,
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📖 Info: ${cmd.name}`)
                .setColor('#7289DA')
                .addFields(
                    { name: '📂 Categoría', value: cmd.category, inline: true },
                    { name: '📝 Descripción', value: cmd.desc, inline: false },
                    { name: '⌨️ Uso', value: `\`${cmd.usage}\``, inline: false }
                )
                .setFooter({ text: '[ ] = obligatorio  •  ( ) = opcional' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }

        const embeds = [];
        const categories = Object.entries(ALL_COMMANDS);

        for (const [category, cmds] of categories) {
            const uniqueCmds = [];
            const seen = new Set();
            for (const cmd of cmds) {
                if (!seen.has(cmd.name)) {
                    seen.add(cmd.name);
                    uniqueCmds.push(cmd);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`${category}`)
                .setColor('#7289DA')
                .setDescription(
                    uniqueCmds.map(cmd =>
                        `**${cmd.name}**\n┣ 📝 ${cmd.desc}\n┗ ⌨️ \`${cmd.usage}\``
                    ).join('\n\n')
                );

            embeds.push(embed);
        }

        embeds[embeds.length - 1]
            .setFooter({ text: `[ ] = obligatorio  •  ( ) = opcional  •  Total: ${Object.keys(COMMAND_LOOKUP).length} comandos` })
            .setTimestamp();

        await interaction.reply({ embeds });
    },
};
