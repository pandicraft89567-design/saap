const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage } = require('../utils/i18n');

const ALL_COMMANDS = {
    '🎬 Ocio & Media': [
        { name: '/yt',       usage: '/yt busqueda:texto',    desc: 'Busca videos de YouTube.' },
        { name: '/meme',     usage: '/meme',                 desc: 'Obtén un meme aleatorio.' },
        { name: '/poke',     usage: '/poke',                 desc: 'Busca información de cualquier Pokémon.' },
        { name: '/cita',     usage: '/cita',                 desc: 'Genera una cita famosa como imagen de tarjeta.' },
        { name: '/fortuna',  usage: '/fortuna',              desc: 'Fortuna del día generada por IA.' },
        { name: '/chiste',   usage: '/chiste',               desc: 'Obtén un chiste aleatorio.' },
    ],
    '🎮 Economía & Minijuegos': [
        { name: '/economy',  usage: '/economy',              desc: 'Consulta tu saldo de Solecoins.' },
        { name: '/shop',     usage: '/shop',                 desc: 'Abre la tienda del servidor.' },
        { name: '/comprar',  usage: '/comprar cantidad:número', desc: 'Compra Solecoins con Solecoins diamante.' },
        { name: '/canjear',  usage: '/canjear cantidad:número', desc: 'Canjea Solecoins por recompensas.' },
        { name: '/robar',    usage: '/robar usuario:@usuario', desc: 'Intenta robarle Solecoins a alguien.' },
        { name: '/transferir', usage: '/transferir usuario:@usuario cantidad:número', desc: 'Transfiere Solecoins a otro usuario.' },
        { name: '/coinflip', usage: '/coinflip',             desc: 'Lanza una moneda al aire.' },
        { name: '/dado',     usage: '/dado',                 desc: 'Lanza un dado de 6 caras.' },
        { name: '/dados',    usage: '/dados',                desc: 'Lanza dados estilo D&D.' },
        { name: '/ruleta',   usage: '/ruleta apuesta:número', desc: 'Juega a la ruleta con Solecoins.' },
        { name: '/rps',      usage: '/rps opcion:opción',    desc: 'Piedra, papel o tijera.' },
        { name: '/trivia',   usage: '/trivia',               desc: 'Responde preguntas de trivia.' },
        { name: '/minecraft', usage: '/minecraft servidor:ip', desc: 'Consulta el estado de un servidor de Minecraft.' },
        { name: '/roblox',   usage: '/roblox usuario:nombre', desc: 'Info de un usuario de Roblox.' },
        { name: '/join',     usage: '/join',                 desc: 'Lista de servidores recomendados.' },
    ],
    '💬 Social & Anime': [
        { name: '/diversion beso',     usage: '/diversion beso usuario:@usuario',     desc: 'Dale un beso virtual a alguien.' },
        { name: '/diversion abrazo',   usage: '/diversion abrazo usuario:@usuario',   desc: 'Dale un abrazo virtual a alguien.' },
        { name: '/diversion pat',      usage: '/diversion pat usuario:@usuario',      desc: 'Pat pat a alguien.' },
        { name: '/diversion slap',     usage: '/diversion slap usuario:@usuario',     desc: 'Abofetea a alguien.' },
        { name: '/diversion matar',    usage: '/diversion matar usuario:@usuario',    desc: 'Elimina a alguien de forma divertida.' },
        { name: '/diversion waifu',    usage: '/diversion waifu',                     desc: 'Imagen aleatoria de waifu anime.' },
        { name: '/diversion castigar', usage: '/diversion castigar usuario:@usuario', desc: 'Castiga a alguien.' },
        { name: '/anime',    usage: '/anime tipo:opción',    desc: 'GIFs de anime (waifu, sonrisa, saludo, etc.).' },
        { name: '/megusta',  usage: '/megusta persona:@usuario', desc: 'Dedícale un poema a alguien que te gusta.' },
        { name: '/tuitear',  usage: '/tuitear mensaje:texto [usuario:@usuario]', desc: 'Crea un tweet con formato visual.' },
        { name: '/avatar',   usage: '/avatar [usuario:@usuario]', desc: 'Muestra el avatar de un usuario.' },
        { name: '/perfil',   usage: '/perfil [usuario:@usuario]', desc: 'Muestra el perfil de un usuario.' },
        { name: '/ship',     usage: '/ship usuario1:@usuario usuario2:@usuario', desc: 'Calcula la compatibilidad entre dos usuarios.' },
        { name: '/acertijo', usage: '/acertijo',             desc: 'Acertijo generado por IA.' },
        { name: '/emojis',   usage: '/emojis busqueda:texto', desc: 'Busca emojis del servidor.' },
        { name: '/frase',    usage: '/frase',                desc: 'Genera una frase motivacional.' },
        { name: '/broma',    usage: '/broma',                desc: 'Una broma aleatoria.' },
        { name: '/chiste',   usage: '/chiste',               desc: 'Un chiste aleatorio.' },
        { name: '/poll',     usage: '/poll pregunta:texto',  desc: 'Crea una encuesta.' },
        { name: '/sorteo',   usage: '/sorteo premio:texto duracion:tiempo', desc: 'Crea un sorteo.' },
        { name: '/verdadoreto', usage: '/verdadoreto',       desc: 'Verdad o reto aleatorio.' },
        { name: '/8ball',    usage: '/8ball pregunta:texto', desc: 'La bola mágica responde tu pregunta.' },
        { name: '/mood',     usage: '/mood energia:opción',  desc: 'Paleta de colores según tu estado de ánimo.' },
        { name: '/imagen',   usage: '/imagen',               desc: 'Efectos y filtros de imagen.' },
        { name: '/ia',       usage: '/ia mensaje:texto',     desc: 'Chatea con la IA del bot.' },
    ],
    '⚙️ Utilidades': [
        { name: '/ping',        usage: '/ping',                     desc: 'Muestra la latencia del bot.' },
        { name: '/info',        usage: '/info [comando:nombre]',    desc: 'Info detallada de un comando.' },
        { name: '/infobot',     usage: '/infobot',                  desc: 'Estadísticas técnicas del bot.' },
        { name: '/userinfo',    usage: '/userinfo [usuario:@usuario]', desc: 'Info detallada de un usuario.' },
        { name: '/serverinfo',  usage: '/serverinfo',               desc: 'Info del servidor.' },
        { name: '/language',    usage: '/language idioma:opción',   desc: 'Cambia el idioma (es/en).' },
        { name: '/ayuda',       usage: '/ayuda',                    desc: 'Menú de ayuda del bot.' },
        { name: '/msgrol',      usage: '/msgrol',                   desc: 'Asigna roles por reacción a un mensaje.' },
        { name: '/thread',      usage: '/thread titulo:texto',      desc: 'Crea un hilo en el canal.' },
        { name: '/forum',       usage: '/forum titulo:texto',       desc: 'Crea un post en un canal de foro.' },
        { name: '/clear',       usage: '/clear cantidad:número',    desc: 'Elimina mensajes del canal.' },
        { name: '/clima',       usage: '/clima ciudad:texto',       desc: 'Consulta el clima de una ciudad.' },
        { name: '/buscar',      usage: '/buscar termino:texto',     desc: 'Busca en Wikipedia.' },
        { name: '/crypto',      usage: '/crypto moneda:texto',      desc: 'Precio de una criptomoneda.' },
        { name: '/color',       usage: '/color hex:código',         desc: 'Info visual de un color hex.' },
        { name: '/traductor',   usage: '/traductor texto:texto idioma:opción', desc: 'Traduce texto a otro idioma.' },
        { name: '/traduccion',  usage: '/traduccion',               desc: 'Activa/desactiva la auto-traducción del canal.' },
        { name: '/recordatorio', usage: '/recordatorio tiempo:texto mensaje:texto', desc: 'Crea un recordatorio.' },
        { name: '/web',         usage: '/web',                      desc: 'Enlace a la web oficial del bot.' },
        { name: '/welcomeset activar',   usage: '/welcomeset activar',             desc: 'Activa el sistema de bienvenidas.' },
        { name: '/welcomeset desactivar', usage: '/welcomeset desactivar',         desc: 'Desactiva el sistema de bienvenidas.' },
        { name: '/welcomeset canal',     usage: '/welcomeset canal canal:#canal',  desc: 'Elige el canal de bienvenidas.' },
        { name: '/welcomeset mensaje',   usage: '/welcomeset mensaje texto:texto', desc: 'Edita el mensaje de bienvenida.' },
        { name: '/welcomeset color',     usage: '/welcomeset color color:hex',     desc: 'Cambia el color del embed.' },
        { name: '/welcomeset imagen',    usage: '/welcomeset imagen imagen:archivo', desc: 'Imagen del banner de bienvenida.' },
        { name: '/welcomeset probar',    usage: '/welcomeset probar',              desc: 'Prueba la bienvenida actual.' },
        { name: '/welcomeset ver',       usage: '/welcomeset ver',                 desc: 'Ver la configuración actual.' },
        { name: '/welcomeset premium',   usage: '/welcomeset premium color_welcome:hex imagen_fondo:url color_descripcion:hex mensaje_descripcion:texto', desc: '✨ Bienvenida premium con imagen de fondo personalizada.' },
    ],
    '🛡️ Moderación': [
        { name: '/ban',        usage: '/ban usuario:@usuario [razon:texto]', desc: 'Banea a un usuario del servidor.' },
        { name: '/unban',      usage: '/unban usuario:id',        desc: 'Desbanea a un usuario.' },
        { name: '/banlist',    usage: '/banlist',                 desc: 'Lista de usuarios baneados.' },
        { name: '/hackban',    usage: '/hackban id:número',       desc: 'Banea a un usuario por ID (sin estar en el server).' },
        { name: '/kick',       usage: '/kick usuario:@usuario [razon:texto]', desc: 'Expulsa a un usuario.' },
        { name: '/silenciar',  usage: '/silenciar usuario:@usuario [duracion:tiempo]', desc: 'Silencia a un usuario.' },
        { name: '/desilenciar', usage: '/desilenciar usuario:@usuario', desc: 'Quita el silencio a un usuario.' },
        { name: '/advertir',   usage: '/advertir usuario:@usuario razon:texto', desc: 'Advierte a un usuario.' },
        { name: '/role',       usage: '/role usuario:@usuario rol:@rol', desc: 'Asigna o quita un rol.' },
        { name: '/slowmode',   usage: '/slowmode segundos:número', desc: 'Modo lento en el canal.' },
        { name: '/lockdown',   usage: '/lockdown',               desc: 'Bloquea el canal actual.' },
        { name: '/nick',       usage: '/nick usuario:@usuario apodo:texto', desc: 'Cambia el apodo de un usuario.' },
        { name: '/announce',   usage: '/announce canal:#canal mensaje:texto', desc: 'Envía un anuncio.' },
        { name: '/md',         usage: '/md usuario:@usuario mensaje:texto', desc: 'Envía un DM como el bot.' },
        { name: '/send',       usage: '/send canal:#canal mensaje:texto', desc: 'Envía un mensaje a un canal.' },
        { name: '/reaction',   usage: '/reaction mensaje:id emoji:emoji', desc: 'Añade una reacción automática.' },
        { name: '/purgebot',   usage: '/purgebot cantidad:número', desc: 'Elimina mensajes del bot.' },
        { name: '/moveall',    usage: '/moveall canal:voz',       desc: 'Mueve a todos de un canal de voz.' },
        { name: '/automod',    usage: '/automod',                 desc: 'Configura el automod del servidor.' },
        { name: '/antiraid',   usage: '/antiraid',               desc: 'Configura la protección anti-raid.' },
        { name: '/discordmod', usage: '/discordmod',             desc: 'Herramientas avanzadas de moderación de Discord.' },
        { name: '/auditoria',  usage: '/auditoria',              desc: 'Muestra el registro de auditoría del servidor.' },
        { name: '/verificar',  usage: '/verificar rol:@rol',     desc: 'Crea un botón de verificación para el servidor.' },
    ],
    '💎 VIP Premium': [
        { name: '/carta',      usage: '/carta [usuario:@usuario]',   desc: 'Genera una carta o poema con IA.' },
        { name: '/horoscopo',  usage: '/horoscopo signo:opción',     desc: 'Horóscopo del día generado por IA.' },
        { name: '/bio',        usage: '/bio texto:texto',            desc: 'Edita tu bio de perfil.' },
        { name: '/daily-premium', usage: '/daily-premium',          desc: 'Recompensa diaria premium (3× más Solecoins).' },
        { name: '/serverpost', usage: '/serverpost',                 desc: 'Publica tu servidor en el directorio.' },
        { name: '/resumir',    usage: '/resumir texto:texto',        desc: 'Resume un texto con IA.' },
        { name: '/historia',   usage: '/historia tema:texto',        desc: 'Genera una historia con IA.' },
        { name: '/debate',     usage: '/debate tema:texto',          desc: 'Debate con la IA sobre un tema.' },
        { name: '/roast',      usage: '/roast usuario:@usuario',     desc: 'La IA hace un roast de un usuario.' },
        { name: '/consejo',    usage: '/consejo situacion:texto',    desc: 'La IA te da un consejo.' },
        { name: '/rima',       usage: '/rima palabra:texto',         desc: 'La IA crea una rima o rap.' },
        { name: '/prediccion', usage: '/prediccion pregunta:texto',  desc: 'La IA predice tu futuro.' },
        { name: '/receta',     usage: '/receta ingredientes:texto',  desc: 'La IA crea una receta.' },
        { name: '/confesion',  usage: '/confesion mensaje:texto',    desc: 'Confesión anónima en el canal.' },
        { name: '/cumple',     usage: '/cumple usuario:@usuario',    desc: 'Genera un mensaje de cumpleaños con IA.' },
        { name: '/transferir', usage: '/transferir usuario:@usuario cantidad:número', desc: 'Transfiere Solecoins a otro usuario.' },
        { name: '/premium status',          usage: '/premium status',          desc: 'Ver tu estado premium.' },
        { name: '/premium block-channel',   usage: '/premium block-channel usuario:@usuario', desc: 'Bloquea a un usuario del canal.' },
        { name: '/premium patear',          usage: '/premium patear usuario:@usuario', desc: 'Expulsa un usuario (VIP).' },
        { name: '/premium ghost-msg',       usage: '/premium ghost-msg mensaje:texto', desc: 'Mensaje que desaparece en 10s.' },
        { name: '/premium nick',            usage: '/premium nick apodo:texto', desc: 'Apodo con decoración brillante.' },
        { name: '/premium exclusive-avatar', usage: '/premium exclusive-avatar', desc: 'Avatar con aura dorada VIP.' },
        { name: '/welcomeset premium',      usage: '/welcomeset premium color_welcome:hex imagen_fondo:url color_descripcion:hex mensaje_descripcion:texto', desc: 'Bienvenida con imagen de fondo personalizada.' },
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
