const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('md')
        .setNameLocalizations({ 'en-US': 'dm', 'en-GB': 'dm' })
        .setDescription('Envía un mensaje privado a un usuario')
        .setDescriptionLocalizations({ 'en-US': 'Send a private message to a user', 'en-GB': 'Send a private message to a user' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que enviar el mensaje privado')
                .setDescriptionLocalizations({ 'en-US': 'User to send the private message to', 'en-GB': 'User to send the private message to' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensaje')
                .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
                .setDescription('Mensaje a enviar al usuario')
                .setDescriptionLocalizations({ 'en-US': 'Message to send to the user', 'en-GB': 'Message to send to the user' })
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('anonimo')
                .setNameLocalizations({ 'en-US': 'anonymous', 'en-GB': 'anonymous' })
                .setDescription('Enviar mensaje anónimo (solo moderadores)')
                .setDescriptionLocalizations({ 'en-US': 'Send anonymous message (moderators only)', 'en-GB': 'Send anonymous message (moderators only)' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('usuario');
            const messageContent = interaction.options.getString('mensaje');
            const isAnonymous = interaction.options.getBoolean('anonimo') || false;

            // Verificar que no se esté intentando enviar mensaje a sí mismo
            if (targetUser.id === interaction.user.id) {
                const selfMessageEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Error')
                    .setDescription('No puedes enviarte un mensaje privado a ti mismo.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [selfMessageEmbed], flags: 64 });
            }

            const PROTECTED_USER_ID = '832641595110719509';
            if (targetUser.id === PROTECTED_USER_ID) {
                return await interaction.reply({
                    content: '❤️ No, ella es mi novia así que no puedes hacer eso...',
                    flags: 64
                });
            }

            if (targetUser.bot) {
                const botMessageEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Error')
                    .setDescription('No puedes enviar mensajes privados a otros bots.')
                    .setTimestamp();
                return await interaction.reply({ embeds: [botMessageEmbed], flags: 64 });
            }

            // Verificar permisos para mensajes anónimos
            if (isAnonymous && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                const noPermissionEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Sin permisos')
                    .setDescription('Solo los moderadores pueden enviar mensajes anónimos.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [noPermissionEmbed], flags: 64 });
            }

            // Crear embed del mensaje privado
            const dmEmbed = new EmbedBuilder()
                .setColor('#4a90e2')
                .setTitle('📩 Mensaje privado')
                .setDescription(messageContent)
                .setTimestamp();

            // Configurar autor según si es anónimo o no
            if (isAnonymous) {
                dmEmbed.setAuthor({
                    name: `Mensaje anónimo desde ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL() || undefined
                });
                dmEmbed.setFooter({
                    text: 'Mensaje anónimo • No responder a este mensaje',
                    iconURL: interaction.guild.iconURL() || undefined
                });
            } else {
                dmEmbed.setAuthor({
                    name: `${interaction.user.displayName} desde ${interaction.guild.name}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });
                dmEmbed.setFooter({
                    text: `Enviado por ${interaction.user.username} • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL() || undefined
                });
            }

            // Añadir información adicional
            dmEmbed.addFields(
                {
                    name: '🏠 Servidor',
                    value: interaction.guild.name,
                    inline: true
                },
                {
                    name: '📅 Fecha',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true
                }
            );

            try {
                // Intentar enviar el mensaje privado
                await targetUser.send({ embeds: [dmEmbed] });

                // Confirmar envío exitoso
                const successEmbed = new EmbedBuilder()
                    .setColor('#51cf66')
                    .setTitle('✅ Mensaje enviado')
                    .setDescription(`Tu mensaje privado fue enviado exitosamente a **${targetUser.displayName}**.`)
                    .addFields(
                        {
                            name: '👤 Destinatario',
                            value: `${targetUser.displayName} (${targetUser.username})`,
                            inline: true
                        },
                        {
                            name: '📝 Mensaje',
                            value: messageContent.length > 100 ? 
                                   `${messageContent.substring(0, 100)}...` : 
                                   messageContent,
                            inline: false
                        },
                        {
                            name: '🔒 Privacidad',
                            value: isAnonymous ? '🕶️ Anónimo' : '👤 Identificado',
                            inline: true
                        }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [successEmbed], flags: 64 });

                // Log del mensaje enviado
                console.log(`Mensaje privado enviado por ${interaction.user.username} a ${targetUser.username} en ${interaction.guild.name}${isAnonymous ? ' (anónimo)' : ''}`);

            } catch (dmError) {
                console.error('Error enviando mensaje privado:', dmError);

                // Manejar diferentes tipos de errores
                let errorMessage = 'No pude enviar el mensaje privado.';
                
                if (dmError.code === 50007) {
                    errorMessage = 'El usuario tiene los mensajes privados desactivados o no acepta mensajes de usuarios del servidor.';
                } else if (dmError.code === 50013) {
                    errorMessage = 'No tengo permisos para enviar mensajes a este usuario.';
                } else if (dmError.code === 40003) {
                    errorMessage = 'El usuario no está disponible para recibir mensajes.';
                }

                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Error al enviar mensaje')
                    .setDescription(errorMessage)
                    .addFields(
                        {
                            name: '💡 Posibles soluciones',
                            value: '• El usuario debe activar mensajes privados de miembros del servidor\n• El usuario debe aceptar solicitudes de amistad\n• Verificar que el usuario no tenga bloqueado al bot',
                            inline: false
                        },
                        {
                            name: '👤 Usuario objetivo',
                            value: `${targetUser.displayName} (${targetUser.username})`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

        } catch (error) {
            console.error('Error en comando md:', error);
            
            const generalErrorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error del sistema')
                .setDescription('Ocurrió un error inesperado al procesar el comando.')
                .addFields({
                    name: '🔧 Acción sugerida',
                    value: 'Inténtalo de nuevo en unos momentos.',
                    inline: false
                })
                .setTimestamp();

            try {
                await interaction.reply({ embeds: [generalErrorEmbed], flags: 64 });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    },
};