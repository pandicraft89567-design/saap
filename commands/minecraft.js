const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setNameLocalizations({ 'en-US': 'minecraft', 'en-GB': 'minecraft' })
        .setDescription('Información y utilidades de Minecraft')
        .setDescriptionLocalizations({ 'en-US': 'Minecraft information and utilities', 'en-GB': 'Minecraft information and utilities' })
        .addSubcommand(subcommand =>
            subcommand
                .setName('servidor')
                .setNameLocalizations({ 'en-US': 'server', 'en-GB': 'server' })
                .setDescription('Información de un servidor de Minecraft')
                .setDescriptionLocalizations({ 'en-US': 'Information about a Minecraft server', 'en-GB': 'Information about a Minecraft server' })
                .addStringOption(option =>
                    option.setName('ip')
                        .setNameLocalizations({ 'en-US': 'ip', 'en-GB': 'ip' })
                        .setDescription('IP del servidor de Minecraft')
                        .setDescriptionLocalizations({ 'en-US': 'Minecraft server IP', 'en-GB': 'Minecraft server IP' })
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('jugador')
                .setNameLocalizations({ 'en-US': 'player', 'en-GB': 'player' })
                .setDescription('Información de un jugador de Minecraft')
                .setDescriptionLocalizations({ 'en-US': 'Information about a Minecraft player', 'en-GB': 'Information about a Minecraft player' })
                .addStringOption(option =>
                    option.setName('usuario')
                        .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                        .setDescription('Nombre de usuario de Minecraft')
                        .setDescriptionLocalizations({ 'en-US': 'Minecraft username', 'en-GB': 'Minecraft username' })
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('skin')
                .setNameLocalizations({ 'en-US': 'skin', 'en-GB': 'skin' })
                .setDescription('Muestra la skin de un jugador')
                .setDescriptionLocalizations({ 'en-US': "Show a player's skin", 'en-GB': "Show a player's skin" })
                .addStringOption(option =>
                    option.setName('usuario')
                        .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                        .setDescription('Nombre de usuario de Minecraft')
                        .setDescriptionLocalizations({ 'en-US': 'Minecraft username', 'en-GB': 'Minecraft username' })
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('randomtip')
                .setNameLocalizations({ 'en-US': 'randomtip', 'en-GB': 'randomtip' })
                .setDescription('Consejo aleatorio de Minecraft')
                .setDescriptionLocalizations({ 'en-US': 'Random Minecraft tip', 'en-GB': 'Random Minecraft tip' })),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = await getLanguage(interaction.guildId);
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'servidor':
                await this.handleServer(interaction, lang);
                break;
            case 'jugador':
                await this.handlePlayer(interaction, lang);
                break;
            case 'skin':
                await this.handleSkin(interaction, lang);
                break;
            case 'randomtip':
                await this.handleRandomTip(interaction, lang);
                break;
        }
    },

    async handleServer(interaction, lang) {
        try {
            const serverIP = interaction.options.getString('ip');
            const response = await axios.get(`https://api.mcsrvstat.us/3/${serverIP}`, { timeout: 10000 });
            const serverData = response.data;
            
            if (!serverData.online) {
                const offlineEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(lang === 'es' ? '🔴 Servidor Offline' : '🔴 Server Offline')
                    .setDescription(lang === 'es' ? `El servidor **${serverIP}** está desconectado.` : `The server **${serverIP}** is offline.`)
                    .setTimestamp();
                return await interaction.editReply({ embeds: [offlineEmbed] });
            }

            const serverEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(lang === 'es' ? '🟢 Estado del Servidor' : '🟢 Server Status')
                .setDescription(`**${serverIP}**`)
                .addFields(
                    { name: lang === 'es' ? '👥 Jugadores' : '👥 Players', value: `${serverData.players.online}/${serverData.players.max}`, inline: true },
                    { name: '🏷️ Versión', value: serverData.version || 'Desconocida', inline: true }
                );
            await interaction.editReply({ embeds: [serverEmbed] });
        } catch (error) {
            await interaction.editReply({ content: t('IA_ERROR', lang) });
        }
    },

    async handlePlayer(interaction, lang) {
        try {
            const username = interaction.options.getString('usuario');
            const uuidResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, { timeout: 5000 });
            const playerData = uuidResponse.data;
            
            if (!playerData) {
                return await interaction.editReply({ content: lang === 'es' ? 'Jugador no encontrado.' : 'Player not found.' });
            }

            const playerEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(lang === 'es' ? '🎮 Info del Jugador' : '🎮 Player Info')
                .setDescription(`**${playerData.name}**`)
                .setThumbnail(`https://mc-heads.net/avatar/${playerData.id}/100`)
                .setTimestamp();
            await interaction.editReply({ embeds: [playerEmbed] });
        } catch (error) {
            await interaction.editReply({ content: t('IA_ERROR', lang) });
        }
    },

    async handleSkin(interaction, lang) {
        const username = interaction.options.getString('usuario');
        const skinEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(lang === 'es' ? '🎨 Skin de Minecraft' : '🎨 Minecraft Skin')
            .setDescription(`**${username}**`)
            .setImage(`https://mc-heads.net/body/${username}/150`)
            .setTimestamp();
        await interaction.editReply({ embeds: [skinEmbed] });
    },

    async handleRandomTip(interaction, lang) {
        const tips = lang === 'es' ? ['💡 El agua puede protegerte de explosiones.', '🌱 Los cultivos crecen más rápido cerca del agua.'] : ['💡 Water can protect you from explosions.', '🌱 Crops grow faster near water.'];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        const tipEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(lang === 'es' ? '💡 Consejo' : '💡 Tip')
            .setDescription(randomTip)
            .setTimestamp();
        await interaction.editReply({ embeds: [tipEmbed] });
    },
};