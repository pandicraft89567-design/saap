const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roblox')
        .setNameLocalizations({ 'en-US': 'roblox', 'en-GB': 'roblox' })
        .setDescription('Información y utilidades de Roblox')
        .setDescriptionLocalizations({ 'en-US': 'Roblox information and utilities', 'en-GB': 'Roblox information and utilities' })
        .addSubcommand(subcommand =>
            subcommand
                .setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Información de un usuario de Roblox')
                .setDescriptionLocalizations({ 'en-US': 'Information about a Roblox user', 'en-GB': 'Information about a Roblox user' })
                .addStringOption(option =>
                    option.setName('nombre')
                        .setNameLocalizations({ 'en-US': 'name', 'en-GB': 'name' })
                        .setDescription('Nombre de usuario de Roblox')
                        .setDescriptionLocalizations({ 'en-US': 'Roblox username', 'en-GB': 'Roblox username' })
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('juego')
                .setNameLocalizations({ 'en-US': 'game', 'en-GB': 'game' })
                .setDescription('Información de un juego de Roblox')
                .setDescriptionLocalizations({ 'en-US': 'Information about a Roblox game', 'en-GB': 'Information about a Roblox game' })
                .addStringOption(option =>
                    option.setName('id')
                        .setNameLocalizations({ 'en-US': 'id', 'en-GB': 'id' })
                        .setDescription('ID del juego de Roblox')
                        .setDescriptionLocalizations({ 'en-US': 'Roblox game ID', 'en-GB': 'Roblox game ID' })
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('avatar')
                .setNameLocalizations({ 'en-US': 'avatar', 'en-GB': 'avatar' })
                .setDescription('Muestra el avatar de un usuario')
                .setDescriptionLocalizations({ 'en-US': "Show a user's avatar", 'en-GB': "Show a user's avatar" })
                .addStringOption(option =>
                    option.setName('nombre')
                        .setNameLocalizations({ 'en-US': 'name', 'en-GB': 'name' })
                        .setDescription('Nombre de usuario de Roblox')
                        .setDescriptionLocalizations({ 'en-US': 'Roblox username', 'en-GB': 'Roblox username' })
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('grupo')
                .setNameLocalizations({ 'en-US': 'group', 'en-GB': 'group' })
                .setDescription('Información de un grupo de Roblox')
                .setDescriptionLocalizations({ 'en-US': 'Information about a Roblox group', 'en-GB': 'Information about a Roblox group' })
                .addStringOption(option =>
                    option.setName('id')
                        .setNameLocalizations({ 'en-US': 'id', 'en-GB': 'id' })
                        .setDescription('ID del grupo de Roblox')
                        .setDescriptionLocalizations({ 'en-US': 'Roblox group ID', 'en-GB': 'Roblox group ID' })
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = await getLanguage(interaction.guildId);
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'usuario':
                await this.handleUser(interaction, lang);
                break;
            case 'juego':
                await this.handleGame(interaction, lang);
                break;
            case 'avatar':
                await this.handleAvatar(interaction, lang);
                break;
            case 'grupo':
                await this.handleGroup(interaction, lang);
                break;
        }
    },

    async handleUser(interaction, lang) {
        try {
            const username = interaction.options.getString('nombre');
            const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [username] }, { timeout: 10000 });
            if (!userResponse.data.data || userResponse.data.data.length === 0) {
                return await interaction.editReply({ content: lang === 'es' ? 'Usuario no encontrado.' : 'User not found.' });
            }
            const userData = userResponse.data.data[0];
            const userDetailsResponse = await axios.get(`https://users.roblox.com/v1/users/${userData.id}`, { timeout: 5000 });
            const userDetails = userDetailsResponse.data;

            const userEmbed = new EmbedBuilder()
                .setColor('#00b2ff')
                .setTitle(t('ROBLOX_USER_TITLE', lang))
                .setDescription(`**${userDetails.displayName}** (@${userDetails.name})`)
                .addFields(
                    { name: '🆔 ID', value: userData.id.toString(), inline: true },
                    { name: t('ROBLOX_CREATED', lang), value: new Date(userDetails.created).toLocaleDateString(), inline: true }
                );
            await interaction.editReply({ embeds: [userEmbed] });
        } catch (error) {
            await interaction.editReply({ content: t('ROBLOX_ERROR', lang) });
        }
    },

    async handleGame(interaction, lang) {
        try {
            const gameId = interaction.options.getString('id');
            const gameResponse = await axios.get(`https://games.roblox.com/v1/games?universeIds=${gameId}`, { timeout: 10000 });
            if (!gameResponse.data.data || gameResponse.data.data.length === 0) {
                return await interaction.editReply({ content: lang === 'es' ? 'Juego no encontrado.' : 'Game not found.' });
            }
            const gameData = gameResponse.data.data[0];
            const gameEmbed = new EmbedBuilder()
                .setColor('#00b2ff')
                .setTitle(lang === 'es' ? '🎮 Juego de Roblox' : '🎮 Roblox Game')
                .setDescription(`**${gameData.name}**`)
                .addFields({ name: '👥 ' + (lang === 'es' ? 'Jugadores' : 'Players'), value: gameData.playing?.toString() || '0', inline: true });
            await interaction.editReply({ embeds: [gameEmbed] });
        } catch (error) {
            await interaction.editReply({ content: t('ROBLOX_ERROR', lang) });
        }
    },

    async handleAvatar(interaction, lang) {
        try {
            const username = interaction.options.getString('nombre');
            const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [username] }, { timeout: 5000 });
            if (!userResponse.data.data || userResponse.data.data.length === 0) return await interaction.editReply({ content: 'User not found.' });
            const userData = userResponse.data.data[0];
            const avatarEmbed = new EmbedBuilder()
                .setColor('#00b2ff')
                .setTitle(lang === 'es' ? '🎨 Avatar de Roblox' : '🎨 Roblox Avatar')
                .setDescription(`**${userData.displayName}**`);
            const avatarRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=420x420&format=Png`);
            if (avatarRes.data.data && avatarRes.data.data.length > 0) avatarEmbed.setImage(avatarRes.data.data[0].imageUrl);
            await interaction.editReply({ embeds: [avatarEmbed] });
        } catch (error) {
            await interaction.editReply({ content: t('ROBLOX_ERROR', lang) });
        }
    },

    async handleGroup(interaction, lang) {
        try {
            const groupId = interaction.options.getString('id');
            const groupResponse = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}`);
            const groupData = groupResponse.data;
            const groupEmbed = new EmbedBuilder()
                .setColor('#00b2ff')
                .setTitle(lang === 'es' ? '👥 Grupo de Roblox' : '👥 Roblox Group')
                .setDescription(`**${groupData.name}**`)
                .addFields({ name: lang === 'es' ? '👥 Miembros' : '👥 Members', value: groupData.memberCount?.toString() || '0', inline: true });
            await interaction.editReply({ embeds: [groupEmbed] });
        } catch (error) {
            await interaction.editReply({ content: t('ROBLOX_ERROR', lang) });
        }
    },
};