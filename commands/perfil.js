const embed = new EmbedBuilder()
    .setColor(fetchedUser.accentColor || member?.displayHexColor || 0xFF69B4)
    .setAuthor({
        name: `${fetchedUser.globalName ?? fetchedUser.username}`,
        iconURL: avatarURL
    })
    .setDescription(`✨ Perfil completo de ${fetchedUser}`)

    .addFields(
        { name: '👤 Información', value: ' ', inline: false },

        { name: '🏷️ Usuario', value: fetchedUser.tag, inline: true },
        { name: '🆔 ID', value: fetchedUser.id, inline: true },
        { name: '📶 Estado', value: statusText, inline: true },

        { name: '━━━━━━━━━━━━━━━', value: ' ', inline: false },

        { name: '📅 Cuenta creada', value: `<t:${createdAt}:D>\n<t:${createdAt}:R>`, inline: true },

        ...(joinedAt ? [{
            name: '📥 Entró',
            value: `<t:${joinedAt}:D>\n<t:${joinedAt}:R>`,
            inline: true
        }] : []),

        ...(accentColor ? [{
            name: '🎨 Color',
            value: accentColor,
            inline: true
        }] : [])
    );

if (roles.length > 0) {
    embed.addFields({
        name: `🏅 Roles (${member.roles.cache.size - 1})`,
        value: roles.join(' • ') || 'Ninguno',
        inline: false
    });
}

if (userBio) {
    embed.addFields({
        name: '📝 Bio Premium',
        value: userBio,
        inline: false
    });
}

const links = [`[🖼️ Avatar](${avatarURL})`];
if (bannerURL) links.push(`[🏳️ Banner](${bannerURL})`);

embed.addFields({
    name: '🔗 Enlaces',
    value: links.join(' • '),
    inline: false
});

embed
    .setThumbnail(avatarURL)
    .setFooter({ 
        text: `Soledad ❣ • Solicitado por ${interaction.user.username}`, 
        iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

if (bannerURL) embed.setImage(bannerURL);
