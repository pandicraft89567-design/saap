const { 
    Events, 
    EmbedBuilder, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, t, wrapInteraction } = require('../utils/i18n');

const processedInteractions = new Set();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // Deduplicación
        if (processedInteractions.has(interaction.id)) return;
        processedInteractions.add(interaction.id);
        setTimeout(() => processedInteractions.delete(interaction.id), 10000);

        // ===============================
        // 🔘 BOTONES
        // ===============================
        if (interaction.isButton()) {

            // ===== BOTONES DE /send =====
            if (interaction.customId.startsWith('delete_')) {
                const messageId = interaction.customId.replace('delete_', '');

                try {
                    const msg = await interaction.channel.messages.fetch(messageId);
                    await msg.delete();

                    return interaction.reply({
                        content: '✅ Mensaje eliminado.',
                        flags: 64
                    });

                } catch {
                    return interaction.reply({
                        content: '❌ No pude eliminar el mensaje.',
                        flags: 64
                    });
                }
            }

            if (interaction.customId.startsWith('edit_')) {
                const messageId = interaction.customId.replace('edit_', '');

                const modal = new ModalBuilder()
                    .setCustomId(`modal_${messageId}`)
                    .setTitle('Editar mensaje');

                const input = new TextInputBuilder()
                    .setCustomId('newContent')
                    .setLabel('Nuevo contenido')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(input);
                modal.addComponents(row);

                return interaction.showModal(modal);
            }

            // ===== HELP =====
            if (interaction.customId.startsWith('help_')) {
                await this.handleHelpButtons(interaction);
                return;
            }

            // ===== QUOTE =====
            if (interaction.customId.startsWith('quote_style:')) {
                await this.handleQuoteStyle(interaction);
                return;
            }

            // ===== PAGINACIÓN JOIN =====
            if (interaction.customId.startsWith('join_page_')) {
                const page = parseInt(interaction.customId.replace('join_page_', ''));
                const joinCommand = interaction.client.commands.get('join');
                if (joinCommand?.handlePage) {
                    await joinCommand.handlePage(interaction, page);
                }
                return;
            }

            // ===== VERIFICACIÓN =====
            if (interaction.customId.startsWith('verify_')) {
                const roleId = interaction.customId.replace('verify_', '');
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ El rol ya no existe.', flags: 64 });
                }

                if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ Sin permisos.', flags: 64 });
                }

                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.reply({ content: '❌ Jerarquía insuficiente.', flags: 64 });
                }

                try {
                    if (interaction.member.roles.cache.has(roleId)) {
                        return interaction.reply({ content: `✅ Ya tienes el rol ${role.name}`, flags: 64 });
                    }

                    await interaction.member.roles.add(role);

                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#57F287')
                            .setTitle('✅ Verificado')
                            .setDescription(`Rol ${role.name} asignado`)
                        ],
                        flags: 64
                    });

                } catch {
                    return interaction.reply({ content: '❌ Error asignando rol.', flags: 64 });
                }
            }

            // ===== ROLES =====
            if (interaction.customId.startsWith('role_')) {
                const roleId = interaction.customId.replace('role_', '');
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ Rol no existe.', flags: 64 });
                }

                try {
                    const member = interaction.member;

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role);
                        return interaction.reply({ content: `➖ Rol ${role.name} removido`, flags: 64 });
                    } else {
                        await member.roles.add(role);
                        return interaction.reply({ content: `✅ Rol ${role.name} asignado`, flags: 64 });
                    }

                } catch {
                    return interaction.reply({ content: '❌ Error con el rol.', flags: 64 });
                }
            }
        }

        // ===============================
        // 🧾 MODAL (EDITAR MENSAJE)
        // ===============================
        if (interaction.isModalSubmit()) {
            if (!interaction.customId.startsWith('modal_')) return;

            const messageId = interaction.customId.replace('modal_', '');
            const newContent = interaction.fields.getTextInputValue('newContent');

            try {
                const msg = await interaction.channel.messages.fetch(messageId);

                await msg.edit({
                    content: newContent,
                    embeds: []
                });

                return interaction.reply({
                    content: '✅ Mensaje editado.',
                    flags: 64
                });

            } catch {
                return interaction.reply({
                    content: '❌ No pude editar el mensaje.',
                    flags: 64
                });
            }
        }

        // ===============================
        // 📋 SELECT MENUS
        // ===============================
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'language_select') {
                const languageCommand = interaction.client.commands.get('language');
                if (languageCommand?.handleSelect) {
                    await languageCommand.handleSelect(interaction);
                }
                return;
            }
        }

        // ===============================
        // 📋 SLASH COMMANDS
        // ===============================
        if (!interaction.isChatInputCommand()) return;

        if (Date.now() - interaction.createdTimestamp > 2500) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({
                content: '❌ Comando no encontrado.',
                flags: 64
            });
        }

        try {
            const lang = interaction.guildId ? await getLanguage(interaction.guildId).catch(() => 'es') : 'es';

            if (interaction.commandName !== 'language') {
                wrapInteraction(interaction, lang);
            }

            await command.execute(interaction);

        } catch (error) {
            console.error(error);

            const errorEmbed = createErrorEmbed('❌ Error ejecutando comando.');

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};
