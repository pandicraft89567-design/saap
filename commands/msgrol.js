const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('msgrol')
        .setNameLocalizations({ 'en-US': 'msgrole', 'en-GB': 'msgrole' })
        .setDescription('Añade un botón a un mensaje para asignar roles automáticamente')
        .setDescriptionLocalizations({ 'en-US': 'Add a button to a message to automatically assign roles', 'en-GB': 'Add a button to a message to automatically assign roles' })
        .addStringOption(option =>
            option.setName('mensaje_id')
                .setNameLocalizations({ 'en-US': 'message_id', 'en-GB': 'message_id' })
                .setDescription('ID del mensaje al que añadir el botón')
                .setDescriptionLocalizations({ 'en-US': 'ID of the message to add the button to', 'en-GB': 'ID of the message to add the button to' })
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setNameLocalizations({ 'en-US': 'role', 'en-GB': 'role' })
                .setDescription('Rol que se asignará al hacer clic')
                .setDescriptionLocalizations({ 'en-US': 'Role that will be assigned when clicked', 'en-GB': 'Role that will be assigned when clicked' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setNameLocalizations({ 'en-US': 'emoji', 'en-GB': 'emoji' })
                .setDescription('Emoji para el botón (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Emoji for the button (optional)', 'en-GB': 'Emoji for the button (optional)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('texto')
                .setNameLocalizations({ 'en-US': 'text', 'en-GB': 'text' })
                .setDescription('Texto del botón (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Button text (optional)', 'en-GB': 'Button text (optional)' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            const messageId = interaction.options.getString('mensaje_id');
            const role = interaction.options.getRole('rol');
            const emoji = interaction.options.getString('emoji') || '🎭';
            const buttonText = interaction.options.getString('texto') || `Obtener ${role.name}`;

            // Verificar permisos del usuario
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Sin Permisos')
                    .setDescription('Necesitas permisos de "Gestionar Roles" para usar este comando.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [noPermEmbed], flags: 64 });
            }

            // Verificar permisos del bot
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const botNoPermEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Bot Sin Permisos')
                    .setDescription('No tengo permisos para gestionar roles en este servidor.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [botNoPermEmbed], flags: 64 });
            }

            // Verificar jerarquía de roles
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                const hierarchyEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Jerarquía de Roles')
                    .setDescription('No puedo asignar este rol porque está en una posición igual o superior a mi rol más alto.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [hierarchyEmbed], flags: 64 });
            }

            if (role.position >= interaction.member.roles.highest.position) {
                const userHierarchyEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Jerarquía Insuficiente')
                    .setDescription('No puedes configurar un rol que está en una posición igual o superior a tu rol más alto.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [userHierarchyEmbed], flags: 64 });
            }

            // Reconocer antes de buscar el mensaje (puede tardar si busca en todos los canales)
            await interaction.deferReply({ flags: 64 });

            // Buscar el mensaje (primero en el canal actual, luego en todo el servidor)
            let targetMessage = null;
            try {
                // Intentar buscar en el canal actual primero
                targetMessage = await interaction.channel.messages.fetch(messageId);
            } catch (error) {
                // Si no se encuentra, buscar en todos los canales del servidor
                console.log('Mensaje no encontrado en canal actual, buscando en otros canales...');
                
                for (const channel of interaction.guild.channels.cache.values()) {
                    if (channel.isTextBased() && channel.permissionsFor(interaction.guild.members.me)?.has('ViewChannel')) {
                        try {
                            targetMessage = await channel.messages.fetch(messageId);
                            if (targetMessage) {
                                break;
                            }
                        } catch (e) {
                            // Continuar buscando en otros canales
                            continue;
                        }
                    }
                }
            }

            if (!targetMessage) {
                const messageErrorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Mensaje No Encontrado')
                    .setDescription(`No pude encontrar el mensaje con ID \`${messageId}\` en ningún canal del servidor.\n\n**Consejos:**\n• Asegúrate de que el ID sea correcto\n• Verifica que el mensaje exista\n• El bot debe tener permisos para ver el canal`)
                    .addFields(
                        { name: '🔍 Cómo obtener el ID de un mensaje', value: 'Activa el Modo Desarrollador en Discord, luego haz clic derecho en un mensaje y selecciona "Copiar ID"', inline: false }
                    )
                    .setTimestamp();

                return await interaction.editReply({ embeds: [messageErrorEmbed] });
            }

            // Crear el botón
            const button = new ButtonBuilder()
                .setCustomId(`role_${role.id}`)
                .setLabel(buttonText)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            // Obtener componentes existentes si los hay
            const existingComponents = targetMessage.components || [];
            
            // Verificar si ya hay 5 filas (límite de Discord)
            if (existingComponents.length >= 5) {
                const limitEmbed = new EmbedBuilder()
                    .setColor('#ff9500')
                    .setTitle('⚠️ Límite Alcanzado')
                    .setDescription('Este mensaje ya tiene el máximo de 5 filas de botones permitidas.')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [limitEmbed] });
            }

            // Verificar si el último componente tiene espacio para otro botón
            let updatedComponents = [...existingComponents];
            const lastRow = updatedComponents[updatedComponents.length - 1];
            
            if (lastRow && lastRow.components.length < 5) {
                // Añadir botón a la última fila existente
                lastRow.components.push(button.toJSON());
            } else {
                // Crear nueva fila
                updatedComponents.push(row);
            }

            // Actualizar el mensaje
            await targetMessage.edit({ 
                content: targetMessage.content,
                embeds: targetMessage.embeds,
                components: updatedComponents 
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Botón Añadido')
                .setDescription(`Botón para el rol ${role.toString()} añadido exitosamente al mensaje en ${targetMessage.channel.toString()}.`)
                .addFields(
                    { name: '🎭 Emoji', value: emoji, inline: true },
                    { name: '📝 Texto', value: buttonText, inline: true },
                    { name: '🏷️ Rol', value: role.name, inline: true },
                    { name: '📍 Canal', value: targetMessage.channel.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error en comando msgrol:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Hubo un error al procesar el comando. Verifica los permisos y la información proporcionada.')
                .setTimestamp();

            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: 64 });
                }
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    },
};