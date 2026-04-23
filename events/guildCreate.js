const { Events, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ensureAutoModRules } = require('../utils/autoModSetup');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`📥 Bot añadido al servidor: ${guild.name} (${guild.memberCount} miembros)`);

        if (guild.client.statusManager) {
            guild.client.statusManager.onGuildUpdate();
        }

        // Crear reglas nativas de AutoMod automáticamente al unirse a un nuevo servidor
        ensureAutoModRules(guild)
            .then(res => {
                if (res.ok) {
                    console.log(`🛡️ AutoMod en ${guild.name}: ${res.created} reglas creadas (total ~${res.total}).`);
                } else {
                    console.log(`🛡️ AutoMod en ${guild.name}: omitido (${res.reason}).`);
                }
            })
            .catch(err => console.error(`❌ Error AutoMod en ${guild.name}:`, err.message));

        const totalGuilds = guild.client.guilds.cache.size;
        const totalUsers = guild.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        console.log(`📊 Estadísticas actualizadas: ${totalGuilds} servidores, ${totalUsers} usuarios`);

        // Buscar emojis personalizados de la aplicación
        let emojis = {};
        try {
            const appEmojis = await guild.client.application.emojis.fetch();
            appEmojis.forEach(emoji => {
                emojis[emoji.name] = emoji.toString();
            });
            console.log(`✨ Emojis de aplicación cargados: ${Object.keys(emojis).join(', ')}`);
        } catch (e) {
            console.log('⚠️ No se pudieron cargar emojis de aplicación:', e.message);
        }

        // Encontrar el mejor canal para enviar el mensaje
        const channel =
            guild.systemChannel ||
            guild.channels.cache.find(ch =>
                ch.type === 0 &&
                ['general', 'chat', 'bienvenida', 'welcome', 'inicio', 'inicio-aqui', 'lobby'].some(n =>
                    ch.name.toLowerCase().includes(n)
                ) &&
                ch.permissionsFor(guild.members.me).has([
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks
                ])
            ) ||
            guild.channels.cache.find(ch =>
                ch.type === 0 &&
                ch.permissionsFor(guild.members.me).has([
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks
                ])
            );

        if (!channel) {
            console.log(`⚠️ No se encontró canal disponible en: ${guild.name}`);
            return;
        }

        const e = (name, fallback) => emojis[name] || fallback;

        const embed = new EmbedBuilder()
            .setTitle(`${e('soledad', '❣️')} ¡Hola! Soy **Soledad** ${e('soledad', '❣️')}`)
            .setDescription(
                `${e('sparkles', '✨')} ¡Gracias por añadirme a **${guild.name}**! Estoy aquí para hacer tu servidor más divertido y animado.\n\n` +
                `${e('star', '⭐')} **¿Qué puedo hacer por ti?**`
            )
            .setColor('#FF69B4')
            .setThumbnail(guild.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: `${e('anime', '🎌')} Entretenimiento`,
                    value: '`/meme` `/anime` `/coinflip` `/8ball` `/megusta`',
                    inline: true
                },
                {
                    name: `${e('moderacion', '🛡️')} Moderación`,
                    value: '`/ban` `/clear` `/silenciar` `/slowmode`',
                    inline: true
                },
                {
                    name: `${e('economia', '💰')} Economía`,
                    value: '`/economy` `/shop` `/premium`',
                    inline: true
                },
                {
                    name: `${e('bienvenida', '👋')} Bienvenidas`,
                    value: '`/welcomeset` `/welcomeconfig` `/welcometest`',
                    inline: true
                },
                {
                    name: `${e('info', 'ℹ️')} Info & Utilidades`,
                    value: '`/info` `/userinfo` `/serverinfo` `/ping`',
                    inline: true
                },
                {
                    name: `${e('ia', '🤖')} Inteligencia Artificial`,
                    value: '`/ia` para chatear con IA',
                    inline: true
                }
            )
            .addFields({
                name: `${e('config', '⚙️')} Primeros pasos`,
                value:
                    `1. Usa \`/welcomeset\` para configurar el canal de bienvenidas.\n` +
                    `2. Usa \`/ayuda\` para ver todos los comandos disponibles.\n` +
                    `3. ¡Empieza a disfrutar el servidor con todos sus funciones!`,
                inline: false
            })
            .setFooter({
                text: `Soledad ❣ • En ${totalGuilds} servidores con ${totalUsers} usuarios`,
                iconURL: guild.client.user.displayAvatarURL()
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 Servidor Oficial de Soledad')
                .setURL('https://discord.gg/vF237WtTq6')
                .setStyle(ButtonStyle.Link)
        );

        try {
            await channel.send({ embeds: [embed], components: [row] });
            console.log(`✅ Mensaje de presentación enviado en: ${guild.name} → #${channel.name}`);
        } catch (error) {
            console.error(`❌ Error enviando presentación en ${guild.name}:`, error.message);
        }
    },
};
