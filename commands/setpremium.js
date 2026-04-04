const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');

const AUTHORIZED_USER = '738425516155076629';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpremium')
        .setNameLocalizations({ 'en-US': 'setpremium', 'en-GB': 'setpremium' })
        .setDescription('Asigna premium a un usuario (solo propietario)')
        .setDescriptionLocalizations({ 'en-US': 'Assign premium to a user (owner only)', 'en-GB': 'Assign premium to a user (owner only)' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que asignar premium')
                .setDescriptionLocalizations({ 'en-US': 'User to assign premium to', 'en-GB': 'User to assign premium to' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duracion')
                .setNameLocalizations({ 'en-US': 'duration', 'en-GB': 'duration' })
                .setDescription('Duración del premium')
                .setDescriptionLocalizations({ 'en-US': 'Premium duration', 'en-GB': 'Premium duration' })
                .setRequired(true)
                .addChoices(
                    { name: '♾️ Permanente', value: 'permanent' },
                    { name: '📅 1 Año', value: '1year' },
                    { name: '📆 3 Meses', value: '3months' }
                ))
        .addBooleanOption(option =>
            option.setName('remover')
                .setNameLocalizations({ 'en-US': 'remove', 'en-GB': 'remove' })
                .setDescription('¿Remover el premium de este usuario?')
                .setDescriptionLocalizations({ 'en-US': 'Remove premium from this user?', 'en-GB': 'Remove premium from this user?' })
                .setRequired(false)),

    async execute(interaction) {
        if (interaction.user.id !== AUTHORIZED_USER) {
            return await interaction.reply({
                content: '<a:no:1385229842282446898> No tienes permiso para usar este comando.',
                flags: 64
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        const duracion = interaction.options.getString('duracion');
        const remover = interaction.options.getBoolean('remover') ?? false;

        await interaction.deferReply({ flags: 64 });

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [targetUser.id]
            );

            if (remover) {
                await db.query(
                    'UPDATE economy SET premium_until = NULL WHERE user_id = $1',
                    [targetUser.id]
                );

                const embed = new EmbedBuilder()
                    .setColor('#ff4b4b')
                    .setTitle('<a:no:1385229842282446898> Premium Removido')
                    .setDescription(`Se ha removido el premium de ${targetUser}.`)
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .addFields({ name: '👤 Usuario', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: false })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            let premiumUntil;
            let duracionTexto;

            if (duracion === 'permanent') {
                premiumUntil = new Date('2099-12-31');
                duracionTexto = '♾️ Permanente';
            } else if (duracion === '1year') {
                premiumUntil = new Date();
                premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
                duracionTexto = `📅 1 Año (hasta ${premiumUntil.toLocaleDateString('es-ES')})`;
            } else if (duracion === '3months') {
                premiumUntil = new Date();
                premiumUntil.setMonth(premiumUntil.getMonth() + 3);
                duracionTexto = `📆 3 Meses (hasta ${premiumUntil.toLocaleDateString('es-ES')})`;
            }

            await db.query(
                'UPDATE economy SET premium_until = $1 WHERE user_id = $2',
                [premiumUntil, targetUser.id]
            );

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('<a:lux:1385222769566027836> Premium Asignado')
                .setDescription(`${targetUser} ahora tiene acceso **Premium**.`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: false },
                    { name: '⏳ Duración', value: duracionTexto, inline: false }
                )
                .setFooter({ text: `Asignado por ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en setpremium:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al asignar el premium. Revisa los logs.' });
        } finally {
            await db.end();
        }
    },
};
