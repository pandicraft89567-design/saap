const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const MONEDAS = {
    bitcoin:    { nombre: 'Bitcoin',   emoji: '₿' },
    ethereum:   { nombre: 'Ethereum',  emoji: '⟠' },
    solana:     { nombre: 'Solana',    emoji: '◎' },
    dogecoin:   { nombre: 'Dogecoin',  emoji: '🐶' },
    cardano:    { nombre: 'Cardano',   emoji: '₳' },
    ripple:     { nombre: 'XRP',       emoji: '✕' },
    binancecoin:{ nombre: 'BNB',       emoji: '🔶' },
    polkadot:   { nombre: 'Polkadot',  emoji: '●' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Precio actual de una criptomoneda')
        .addStringOption(opt =>
            opt.setName('moneda')
                .setDescription('Criptomoneda a consultar')
                .setRequired(true)
                .addChoices(
                    { name: '₿ Bitcoin',   value: 'bitcoin' },
                    { name: '⟠ Ethereum',  value: 'ethereum' },
                    { name: '◎ Solana',    value: 'solana' },
                    { name: '🐶 Dogecoin', value: 'dogecoin' },
                    { name: '₳ Cardano',   value: 'cardano' },
                    { name: '✕ XRP',       value: 'ripple' },
                    { name: '🔶 BNB',      value: 'binancecoin' },
                    { name: '● Polkadot',  value: 'polkadot' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const id = interaction.options.getString('moneda');
        const info = MONEDAS[id];

        try {
            const res = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price`,
                {
                    params: { ids: id, vs_currencies: 'usd,eur', include_24hr_change: true, include_market_cap: true },
                    timeout: 8000
                }
            );

            const data = res.data[id];
            if (!data) return await interaction.editReply({ content: '❌ No pude obtener el precio.' });

            const precio_usd = data.usd?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || 'N/A';
            const precio_eur = data.eur?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || 'N/A';
            const cambio_24h = data.usd_24h_change?.toFixed(2);
            const market_cap = data.usd_market_cap ? `$${(data.usd_market_cap / 1e9).toFixed(2)}B` : 'N/A';

            const subida = parseFloat(cambio_24h) >= 0;
            const color  = subida ? '#4ADE80' : '#FF4444';
            const flecha = subida ? '📈' : '📉';

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${info.emoji} ${info.nombre}`)
                .addFields(
                    { name: '💵 USD',         value: `**$${precio_usd}**`,                                              inline: true },
                    { name: '💶 EUR',         value: `**€${precio_eur}**`,                                              inline: true },
                    { name: `${flecha} 24h`,  value: `${subida ? '+' : ''}${cambio_24h}%`,                              inline: true },
                    { name: '🏦 Market Cap',  value: market_cap,                                                         inline: true }
                )
                .setFooter({ text: `CoinGecko • Solicitado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en crypto:', error.message);
            await interaction.editReply({ content: '❌ No pude obtener el precio. Intenta de nuevo.' });
        }
    }
};
