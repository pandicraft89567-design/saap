const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clima')
        .setNameLocalizations({ 'en-US': 'weather', 'en-GB': 'weather' })
        .setDescription('Muestra el clima actual de una ciudad')
        .setDescriptionLocalizations({ 'en-US': 'Show the current weather for a city', 'en-GB': 'Show the current weather for a city' })
        .addStringOption(opt =>
            opt.setName('ciudad')
                .setNameLocalizations({ 'en-US': 'city', 'en-GB': 'city' })
                .setDescription('Nombre de la ciudad (ej: Bogotá, Madrid)')
                .setDescriptionLocalizations({ 'en-US': 'City name (e.g. Bogotá, Madrid)', 'en-GB': 'City name (e.g. Bogotá, Madrid)' })
                .setRequired(true)
                .setMaxLength(60))
        .addStringOption(opt =>
            opt.setName('pais')
                .setNameLocalizations({ 'en-US': 'country', 'en-GB': 'country' })
                .setDescription('País para mayor precisión (ej: Colombia, España)')
                .setDescriptionLocalizations({ 'en-US': 'Country for more precision (e.g. Colombia, Spain)', 'en-GB': 'Country for more precision (e.g. Colombia, Spain)' })
                .setRequired(false)
                .setMaxLength(60))
        .addStringOption(opt =>
            opt.setName('region')
                .setNameLocalizations({ 'en-US': 'region', 'en-GB': 'region' })
                .setDescription('Región, estado o departamento (ej: Antioquia, Cataluña)')
                .setDescriptionLocalizations({ 'en-US': 'Region, state or department (e.g. Antioquia, Catalonia)', 'en-GB': 'Region, state or department (e.g. Antioquia, Catalonia)' })
                .setRequired(false)
                .setMaxLength(60)),

    async execute(interaction) {
        await interaction.deferReply();

        const ciudad = interaction.options.getString('ciudad').trim();
        const pais   = interaction.options.getString('pais')?.trim();
        const region = interaction.options.getString('region')?.trim();

        // Construir query combinando los campos disponibles
        const partes = [ciudad];
        if (region) partes.push(region);
        if (pais)   partes.push(pais);
        const query = partes.join(', ');

        try {
            const res = await axios.get(
                `https://wttr.in/${encodeURIComponent(query)}?format=j1`,
                { timeout: 8000, headers: { 'User-Agent': 'DiscordBot/1.0' } }
            );

            const data   = res.data;
            const actual = data.current_condition[0];
            const info   = data.nearest_area[0];

            const ciudad_nombre = info.areaName[0].value;
            const region_nombre = info.region?.[0]?.value ?? null;
            const pais_nombre   = info.country[0].value;
            const temp_c        = actual.temp_C;
            const sensacion     = actual.FeelsLikeC;
            const humedad       = actual.humidity;
            const viento        = actual.windspeedKmph;
            const descripcion   = actual.lang_es?.[0]?.value || actual.weatherDesc[0].value;
            const uv            = actual.uvIndex;

            const tempNum = parseInt(temp_c);
            let color = '#60A5FA';
            if (tempNum >= 30)  color = '#FF4500';
            else if (tempNum >= 20) color = '#FFD700';
            else if (tempNum >= 10) color = '#90EE90';
            else if (tempNum < 0)   color = '#B0E0E6';

            const hoy = data.weather[0];
            const max = hoy.maxtempC;
            const min = hoy.mintempC;

            // Título con la info real devuelta por la API
            const tituloLugar = [ciudad_nombre, region_nombre, pais_nombre]
                .filter(Boolean).join(', ');

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`🌤️ Clima en ${tituloLugar}`)
                .setDescription(`**${descripcion}**`)
                .addFields(
                    { name: '🌡️ Temperatura', value: `**${temp_c}°C**`,    inline: true },
                    { name: '🤔 Sensación',    value: `${sensacion}°C`,      inline: true },
                    { name: '💧 Humedad',      value: `${humedad}%`,         inline: true },
                    { name: '💨 Viento',       value: `${viento} km/h`,      inline: true },
                    { name: '☀️ UV',           value: `${uv}`,               inline: true },
                    { name: '📈 Máx/Mín hoy', value: `${max}°C / ${min}°C`, inline: true }
                )
                .setFooter({ text: `Solicitado por ${interaction.user.username} • Datos de wttr.in` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 400) {
                await interaction.editReply({ content: `❌ No encontré **${query}**. Verifica el nombre.` });
            } else {
                await interaction.editReply({ content: '❌ No pude obtener el clima. Intenta de nuevo.' });
            }
        }
    }
};
