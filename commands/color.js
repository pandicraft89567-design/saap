const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function hexToRgb(hex) {
    const limpio = hex.replace('#', '');
    const num    = parseInt(limpio, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getNombreColor(r, g, b) {
    const hsl = rgbToHsl(r, g, b);
    if (hsl.s < 10) {
        if (hsl.l > 90) return 'Blanco';
        if (hsl.l > 60) return 'Gris claro';
        if (hsl.l > 30) return 'Gris';
        return 'Negro';
    }
    const h = hsl.h;
    if (h < 15)  return 'Rojo';
    if (h < 30)  return 'Naranja rojizo';
    if (h < 45)  return 'Naranja';
    if (h < 65)  return 'Amarillo';
    if (h < 90)  return 'Amarillo verdoso';
    if (h < 150) return 'Verde';
    if (h < 170) return 'Verde azulado';
    if (h < 195) return 'Cian';
    if (h < 240) return 'Azul';
    if (h < 270) return 'Azul violáceo';
    if (h < 300) return 'Violeta';
    if (h < 330) return 'Rosa';
    return 'Rojo rosado';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setNameLocalizations({ 'en-US': 'color', 'en-GB': 'color' })
        .setDescription('Muestra información detallada de un color hexadecimal')
        .setDescriptionLocalizations({ 'en-US': 'Shows detailed information about a hex color', 'en-GB': 'Shows detailed information about a hex color' })
        .addStringOption(opt =>
            opt.setName('hex')
                .setNameLocalizations({ 'en-US': 'hex', 'en-GB': 'hex' })
                .setDescription('Código hex del color (ej: #FF5733, C084FC)')
                .setDescriptionLocalizations({ 'en-US': 'Hex color code (e.g. #FF5733, C084FC)', 'en-GB': 'Hex color code (e.g. #FF5733, C084FC)' })
                .setRequired(true)
                .setMaxLength(7)),

    async execute(interaction) {
        let hex = interaction.options.getString('hex').trim().replace('#', '');

        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
            return await interaction.reply({
                content: '❌ Código hexadecimal inválido. Usa formato `#RRGGBB` (ej: `#FF5733`).',
                flags: 64
            });
        }

        const hexCompleto = `#${hex.toUpperCase()}`;
        const { r, g, b } = hexToRgb(hex);
        const hsl         = rgbToHsl(r, g, b);
        const nombre      = getNombreColor(r, g, b);
        const invertido   = `#${(0xFFFFFF ^ parseInt(hex, 16)).toString(16).padStart(6, '0').toUpperCase()}`;

        const embed = new EmbedBuilder()
            .setColor(hexCompleto)
            .setTitle(`🎨 Color ${nombre}`)
            .setDescription(`Color de muestra — cuadro de color arriba`)
            .addFields(
                { name: '🔢 HEX',       value: `\`${hexCompleto}\``,                                   inline: true },
                { name: '🟥 RGB',       value: `\`rgb(${r}, ${g}, ${b})\``,                            inline: true },
                { name: '🌈 HSL',       value: `\`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\``,            inline: true },
                { name: '🔲 Invertido', value: `\`${invertido}\``,                                      inline: true },
                { name: '🏷️ Nombre',   value: nombre,                                                   inline: true }
            )
            .setThumbnail(`https://singlecolorimage.com/get/${hex}/200x200`)
            .setFooter({ text: `Solicitado por ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
