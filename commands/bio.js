const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { isPremium, premiumDenied } = require('../utils/checkPremium');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bio')
        .setNameLocalizations({ 'en-US': 'bio', 'en-GB': 'bio' })
        .setDescription('💎 [PREMIUM] Personaliza la bio de tu perfil')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Customize your profile bio', 'en-GB': '💎 [PREMIUM] Customize your profile bio' })
        .addStringOption(option =>
            option.setName('texto')
                .setNameLocalizations({ 'en-US': 'text', 'en-GB': 'text' })
                .setDescription('Tu nueva bio (máx. 200 caracteres). Deja vacío para ver tu bio actual.')
                .setDescriptionLocalizations({ 'en-US': 'Your new bio (max. 200 characters). Leave empty to see your current bio.', 'en-GB': 'Your new bio (max. 200 characters). Leave empty to see your current bio.' })
                .setMaxLength(200)
                .setRequired(false)),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const nuevaBio = interaction.options.getString('texto');
        await interaction.deferReply({ ephemeral: !nuevaBio });

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query(
                'ALTER TABLE economy ADD COLUMN IF NOT EXISTS bio TEXT'
            );

            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [interaction.user.id]
            );

            if (!nuevaBio) {
                const res = await db.query(
                    'SELECT bio FROM economy WHERE user_id = $1',
                    [interaction.user.id]
                );
                const bioActual = res.rows[0]?.bio || '*Sin bio establecida.*';

                const embed = new EmbedBuilder()
                    .setColor('#00FFFF')
                    .setTitle(`<a:lux:1385222769566027836> Bio de ${interaction.user.username}`)
                    .setDescription(bioActual)
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Usa /bio texto: ... para cambiarla • Soledad ❣ Premium' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            await db.query(
                'UPDATE economy SET bio = $1 WHERE user_id = $2',
                [nuevaBio, interaction.user.id]
            );

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('<a:lux:1385222769566027836> Bio Actualizada')
                .setDescription(`Tu bio ha sido guardada exitosamente.`)
                .addFields({ name: '📝 Nueva Bio', value: nuevaBio, inline: false })
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Aparecerá en tu /perfil • Soledad ❣ Premium' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('Error en bio:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al actualizar tu bio.' });
        } finally {
            await db.end();
        }
    },
};
