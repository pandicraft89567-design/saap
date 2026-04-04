const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const TIPOS_COLOR = {
    fire: '#FF4422', water: '#3399FF', grass: '#77CC55', electric: '#FFCC33',
    psychic: '#FF5599', ice: '#66CCFF', dragon: '#7766EE', dark: '#775544',
    fairy: '#FFAAFF', normal: '#AABB99', fighting: '#BB5544', flying: '#8899FF',
    poison: '#AA5599', ground: '#DDBB55', rock: '#BBAA66', bug: '#AABB22',
    ghost: '#6666BB', steel: '#AAAABB'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setNameLocalizations({ 'en-US': 'poke', 'en-GB': 'poke' })
        .setDescription('Muestra información de un Pokémon')
        .setDescriptionLocalizations({ 'en-US': 'Show information about a Pokémon', 'en-GB': 'Show information about a Pokémon' })
        .addStringOption(opt =>
            opt.setName('nombre')
                .setNameLocalizations({ 'en-US': 'name', 'en-GB': 'name' })
                .setDescription('Nombre o número del Pokémon (ej: pikachu, 25)')
                .setDescriptionLocalizations({ 'en-US': 'Pokémon name or number (e.g. pikachu, 25)', 'en-GB': 'Pokémon name or number (e.g. pikachu, 25)' })
                .setRequired(true)
                .setMaxLength(30)),

    async execute(interaction) {
        await interaction.deferReply();

        const nombre = interaction.options.getString('nombre').toLowerCase().trim();

        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${nombre}`, { timeout: 8000 });
            const data = res.data;

            const nombre_es = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            const tipos = data.types.map(t => t.type.name);
            const color = TIPOS_COLOR[tipos[0]] || '#A8A878';

            const stats = data.stats.map(s => {
                const bar = '█'.repeat(Math.floor(s.base_stat / 10)) + '░'.repeat(10 - Math.floor(s.base_stat / 10));
                const nombres = { hp: '❤️ HP', attack: '⚔️ Ataque', defense: '🛡️ Defensa', 'special-attack': '✨ Sp.Atk', 'special-defense': '🌀 Sp.Def', speed: '💨 Velocidad' };
                return `${nombres[s.stat.name] || s.stat.name}: **${s.base_stat}** \`${bar}\``;
            }).join('\n');

            const tipos_texto = tipos.map(t => `\`${t.charAt(0).toUpperCase() + t.slice(1)}\``).join(' ');
            const habilidades = data.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ');
            const imagen = data.sprites.other['official-artwork']?.front_default || data.sprites.front_default;

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`#${String(data.id).padStart(3, '0')} ${nombre_es}`)
                .setThumbnail(imagen)
                .addFields(
                    { name: '🏷️ Tipo',        value: tipos_texto,                                          inline: true },
                    { name: '⚖️ Peso',         value: `${(data.weight / 10).toFixed(1)} kg`,               inline: true },
                    { name: '📏 Altura',       value: `${(data.height / 10).toFixed(1)} m`,                inline: true },
                    { name: '🌟 Habilidades',  value: habilidades,                                          inline: false },
                    { name: '📊 Estadísticas', value: stats,                                                inline: false }
                )
                .setFooter({ text: `Solicitado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            if (error.response?.status === 404) {
                await interaction.editReply({ content: `❌ No encontré el Pokémon **${nombre}**. Verifica el nombre o número.` });
            } else {
                await interaction.editReply({ content: '❌ No pude obtener la información. Intenta de nuevo.' });
            }
        }
    }
};
