const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setNameLocalizations({ 'en-US': 'role', 'en-GB': 'role' })
        .setDescription('Gestión de roles del servidor')
        .setDescriptionLocalizations({ 'en-US': 'Server role management', 'en-GB': 'Server role management' })
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setNameLocalizations({ 'en-US': 'add', 'en-GB': 'add' })
                .setDescription('Añade un rol a un usuario')
                .setDescriptionLocalizations({ 'en-US': 'Add a role to a user', 'en-GB': 'Add a role to a user' })
                .addUserOption(option => option.setName('usuario')
                    .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                    .setDescription('El usuario')
                    .setDescriptionLocalizations({ 'en-US': 'The user', 'en-GB': 'The user' })
                    .setRequired(true))
                .addRoleOption(option => option.setName('rol')
                    .setNameLocalizations({ 'en-US': 'role', 'en-GB': 'role' })
                    .setDescription('El rol a añadir')
                    .setDescriptionLocalizations({ 'en-US': 'The role to add', 'en-GB': 'The role to add' })
                    .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setNameLocalizations({ 'en-US': 'remove', 'en-GB': 'remove' })
                .setDescription('Quita un rol a un usuario')
                .setDescriptionLocalizations({ 'en-US': 'Remove a role from a user', 'en-GB': 'Remove a role from a user' })
                .addUserOption(option => option.setName('usuario')
                    .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                    .setDescription('El usuario')
                    .setDescriptionLocalizations({ 'en-US': 'The user', 'en-GB': 'The user' })
                    .setRequired(true))
                .addRoleOption(option => option.setName('rol')
                    .setNameLocalizations({ 'en-US': 'role', 'en-GB': 'role' })
                    .setDescription('El rol a quitar')
                    .setDescriptionLocalizations({ 'en-US': 'The role to remove', 'en-GB': 'The role to remove' })
                    .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setNameLocalizations({ 'en-US': 'create', 'en-GB': 'create' })
                .setDescription('Crea un nuevo rol en el servidor')
                .setDescriptionLocalizations({ 'en-US': 'Create a new role in the server', 'en-GB': 'Create a new role in the server' })
                .addStringOption(option => option.setName('nombre')
                    .setNameLocalizations({ 'en-US': 'name', 'en-GB': 'name' })
                    .setDescription('Nombre del nuevo rol')
                    .setDescriptionLocalizations({ 'en-US': 'Name of the new role', 'en-GB': 'Name of the new role' })
                    .setRequired(true))
                .addStringOption(option => option.setName('color')
                    .setNameLocalizations({ 'en-US': 'color', 'en-GB': 'color' })
                    .setDescription('Color en Hexadecimal (ej: #FF0000)')
                    .setDescriptionLocalizations({ 'en-US': 'Hex color code (e.g. #FF0000)', 'en-GB': 'Hex color code (e.g. #FF0000)' })))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const user = interaction.options.getMember('usuario');
            const role = interaction.options.getRole('rol');

            if (user.roles.cache.has(role.id)) {
                return interaction.reply({ content: t('ROLE_ALREADY_HAS', lang), flags: 64 });
            }

            try {
                await user.roles.add(role);
                const embed = new EmbedBuilder()
                    .setTitle(t('ROLE_ADDED_TITLE', lang))
                    .setDescription(t('ROLE_ADDED_DESC', lang, { role: role.toString(), user: user.toString() }))
                    .setColor(role.color || '#5865F2')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ content: t('ROLE_CANT_ADD', lang), flags: 64 });
            }
        }

        if (subcommand === 'remove') {
            const user = interaction.options.getMember('usuario');
            const role = interaction.options.getRole('rol');

            if (!user.roles.cache.has(role.id)) {
                return interaction.reply({ content: t('ROLE_DOESNT_HAVE', lang), flags: 64 });
            }

            try {
                await user.roles.remove(role);
                const embed = new EmbedBuilder()
                    .setTitle(t('ROLE_REMOVED_TITLE', lang))
                    .setDescription(t('ROLE_REMOVED_DESC', lang, { role: role.toString(), user: user.toString() }))
                    .setColor('#FF4B4B')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ content: t('ROLE_CANT_REMOVE', lang), flags: 64 });
            }
        }

        if (subcommand === 'create') {
            const name = interaction.options.getString('nombre');
            const color = interaction.options.getString('color') || '#99AAB5';

            try {
                const newRole = await interaction.guild.roles.create({
                    name: name,
                    color: color,
                    reason: `Creado por ${interaction.user.tag}`
                });

                const embed = new EmbedBuilder()
                    .setTitle(t('ROLE_CREATED_TITLE', lang))
                    .setDescription(t('ROLE_CREATED_DESC', lang, { role: newRole.toString() }))
                    .setColor(newRole.color)
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ content: t('ROLE_CREATE_ERROR', lang), flags: 64 });
            }
        }
    },
};
