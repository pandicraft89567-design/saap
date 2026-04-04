const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { getLanguage, t } = require('../utils/i18n');

const SC = '<:Solecoincomun:1488044566907981995>';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setNameLocalizations({ 'en-US': 'shop', 'en-GB': 'shop' })
        .setDescription('Tienda de artículos Premium')
        .setDescriptionLocalizations({ 'en-US': 'Premium item shop', 'en-GB': 'Premium item shop' })
        .addStringOption(option =>
            option.setName('item')
                .setNameLocalizations({ 'en-US': 'item', 'en-GB': 'item' })
                .setDescription('El artículo que quieres comprar')
                .setDescriptionLocalizations({ 'en-US': 'The item you want to buy', 'en-GB': 'The item you want to buy' })
                .setRequired(true)
                .addChoices(
                    { name: 'Premium 24h (1,000 Solecoins)', value: 'premium_1d' },
                    { name: 'Premium 7d (5,000 Solecoins)', value: 'premium_7d' },
                    { name: 'Premium 30d (15,000 Solecoins)', value: 'premium_30d' }
                )),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        const userId = interaction.user.id;
        const item = interaction.options.getString('item');

        const prices = {
            'premium_1d': 1000,
            'premium_7d': 5000,
            'premium_30d': 15000
        };

        const durations = {
            'premium_1d': 1,
            'premium_7d': 7,
            'premium_30d': 30
        };

        try {
            const res = await client.query('SELECT balance, premium_until FROM economy WHERE user_id = $1', [userId]);
            if (res.rows.length === 0) {
                await client.query('INSERT INTO economy (user_id) VALUES ($1)', [userId]);
                return interaction.reply({ content: t('SHOP_NO_COINS', lang), flags: 64 });
            }

            const balance = parseInt(res.rows[0].balance);
            const price = prices[item];

            if (balance < price) {
                const whopNote = `\n\n💎 ¿No tienes suficientes Solecoins? ¡También puedes suscribirte directamente en [**whop.com/soledad-858d**](https://whop.com/soledad-858d)!`;
                return interaction.reply({ content: t('SHOP_INSUFFICIENT', lang, { price, balance }) + whopNote, flags: 64 });
            }

            let currentPremium = res.rows[0].premium_until ? new Date(res.rows[0].premium_until) : new Date();
            if (currentPremium < new Date()) currentPremium = new Date();

            const newPremiumDate = new Date(currentPremium.getTime() + durations[item] * 24 * 60 * 60 * 1000);

            await client.query('UPDATE economy SET balance = balance - $1, premium_until = $2 WHERE user_id = $3', [price, newPremiumDate, userId]);

            const shopTitles = {
                es: '💎 ¡Compra Premium Exitosa!',
                en: '💎 Premium Purchase Successful!',
                fr: '💎 Achat Premium Réussi !',
                pt: '💎 Compra Premium Realizada!',
                de: '💎 Premium-Kauf Erfolgreich!',
                it: '💎 Acquisto Premium Riuscito!',
                ja: '💎 プレミアム購入成功！',
                ko: '💎 프리미엄 구매 성공!',
                zh: '💎 高级购买成功！',
                ru: '💎 Покупка Премиума Успешна!',
                ar: '💎 تم الشراء بنجاح!',
                tr: '💎 Premium Satın Alma Başarılı!'
            };

            const shopDesc = {
                es: `Has comprado **${durations[item]} día(s)** de Premium usando ${SC} Solecoins.\nTu suscripción ahora vence el: \`${newPremiumDate.toLocaleDateString()}\``,
                en: `You bought **${durations[item]} day(s)** of Premium using ${SC} Solecoins.\nYour subscription now expires on: \`${newPremiumDate.toLocaleDateString()}\``,
                fr: `Vous avez acheté **${durations[item]} jour(s)** de Premium.\nVotre abonnement expire le: \`${newPremiumDate.toLocaleDateString()}\``,
                pt: `Você comprou **${durations[item]} dia(s)** de Premium.\nSua assinatura expira em: \`${newPremiumDate.toLocaleDateString()}\``,
                de: `Du hast **${durations[item]} Tag(e)** Premium gekauft.\nDein Abo läuft ab am: \`${newPremiumDate.toLocaleDateString()}\``,
                it: `Hai acquistato **${durations[item]} giorno/i** di Premium.\nIl tuo abbonamento scade il: \`${newPremiumDate.toLocaleDateString()}\``,
                ja: `**${durations[item]}日間**のプレミアムを購入しました。\nサブスクリプション期限: \`${newPremiumDate.toLocaleDateString()}\``,
                ko: `**${durations[item]}일** 프리미엄을 구매했습니다.\n구독 만료일: \`${newPremiumDate.toLocaleDateString()}\``,
                zh: `您购买了 **${durations[item]} 天** 高级会员。\n订阅到期日: \`${newPremiumDate.toLocaleDateString()}\``,
                ru: `Вы купили **${durations[item]} день/дней** Premium.\nПодписка истекает: \`${newPremiumDate.toLocaleDateString()}\``,
                ar: `اشتريت **${durations[item]} يوم** بريميوم.\nينتهي اشتراكك في: \`${newPremiumDate.toLocaleDateString()}\``,
                tr: `**${durations[item]} gün** Premium satın aldınız.\nAboneliğiniz şu tarihte sona eriyor: \`${newPremiumDate.toLocaleDateString()}\``
            };

            const embed = new EmbedBuilder()
                .setTitle(shopTitles[lang] || shopTitles['es'])
                .setDescription(shopDesc[lang] || shopDesc['es'])
                .setColor('#00FFFF');

            return interaction.reply({ embeds: [embed] });

        } finally {
            await client.end();
        }
    },
};
