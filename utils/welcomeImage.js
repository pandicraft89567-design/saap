const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const path = require('path');
const { registerFont } = require('canvas');

registerFont(path.join(__dirname, '../fonts/NotoSans-Regular.ttf'), { family: 'NotoSans' });
registerFont(path.join(__dirname, '../fonts/NotoSans-Bold.ttf'),    { family: 'NotoSans', weight: 'bold' });

const W = 800;
const H = 280;

function stripUnsupported(str) {
    return str
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/\uFE0F/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchImage(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
    return loadImage(Buffer.from(res.data));
}

async function generateWelcomeImage({ username, avatarUrl, memberCount, welcomeColor, descColor, descMessage, bgUrl }) {
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // ── Fondo ──────────────────────────────────────────────────────────────
    if (bgUrl) {
        try {
            const bg = await fetchImage(bgUrl);
            const scale = Math.max(W / bg.width, H / bg.height);
            const bw = bg.width  * scale;
            const bh = bg.height * scale;
            ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
        } catch {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, W, H);
        }
    } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
    }

    // ── Overlay oscuro para legibilidad ────────────────────────────────────
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, W, H);

    // ── Línea de acento izquierda ──────────────────────────────────────────
    const accentColor = welcomeColor || '#ffffff';
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, 5, H);
    ctx.globalAlpha = 1;

    // ── Avatar circular ────────────────────────────────────────────────────
    const AV  = 110;
    const avX = 45;
    const avY = (H - AV) / 2;

    try {
        const img = await fetchImage(avatarUrl);
        // Anillo exterior
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + AV / 2, avY + AV / 2, AV / 2 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth   = 4;
        ctx.stroke();
        ctx.restore();
        // Clip circular
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + AV / 2, avY + AV / 2, AV / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avX, avY, AV, AV);
        ctx.restore();
    } catch {
        ctx.save();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(avX + AV / 2, avY + AV / 2, AV / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── Textos ─────────────────────────────────────────────────────────────
    const textX = avX + AV + 30;

    // "¡BIENVENIDO!" en color_welcome
    ctx.font      = 'bold 18px NotoSans';
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.9;
    ctx.fillText('¡BIENVENIDO!', textX, avY + 24);
    ctx.globalAlpha = 1;

    // Nombre de usuario (grande, blanco)
    const cleanName = stripUnsupported(username);
    ctx.font      = 'bold 36px NotoSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cleanName, textX, avY + 72);

    // Línea separadora
    ctx.strokeStyle = accentColor;
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(textX, avY + 86);
    ctx.lineTo(W - 40, avY + 86);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Mensaje de descripción en color_descripcion
    const cleanDesc = stripUnsupported(descMessage || 'Nos alegra tenerte aqui');
    ctx.font      = '18px NotoSans';
    ctx.fillStyle = descColor || '#cccccc';
    ctx.fillText(cleanDesc, textX, avY + 116);

    // Número de miembro
    ctx.font      = '14px NotoSans';
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.7;
    ctx.fillText(`Miembro #${memberCount}`, textX, avY + 145);
    ctx.globalAlpha = 1;

    return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeImage };
