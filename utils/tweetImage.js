const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

registerFont(path.join(__dirname, '../fonts/NotoSans-Regular.ttf'), { family: 'NotoSans' });
registerFont(path.join(__dirname, '../fonts/NotoSans-Bold.ttf'), { family: 'NotoSans', weight: 'bold' });

const W  = 600;
const PAD = 24;

// Colores modo oscuro X/Twitter
const C = {
    bg:       '#15202B',
    card:     '#1E2732',
    text:     '#E7E9EA',
    muted:    '#8B98A5',
    border:   '#2F3336',
    blue:     '#1D9BF0',
    heart:    '#F91880',
    verified: '#1D9BF0',
};

// Función para envolver texto en múltiples líneas
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

// Icono de X (Twitter) simplificado como texto
function drawXLogo(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = C.text;
    ctx.font = `bold ${size}px NotoSans`;
    ctx.textAlign = 'right';
    ctx.fillText('𝕏', x, y);
    ctx.restore();
}

// Icono de verificación azul
function drawVerified(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = C.verified;
    ctx.font = '14px NotoSans';
    ctx.textAlign = 'left';
    ctx.fillText('✓', x, y);
    ctx.restore();
}

async function generateTweetImage({ displayName, username, avatarUrl, content, likes, retweets, views, timestamp, photoUrl = null }) {
    // Calcular altura necesaria según el contenido
    const canvas = createCanvas(W, 300); // temporal para medir texto
    let ctx = canvas.getContext('2d');

    ctx.font = '18px NotoSans';
    const tweetLines = wrapText(ctx, content, W - PAD * 2);
    const tweetHeight = tweetLines.length * 26;

    // Si hay foto, se reserva espacio extra (imagen de 320px + margen)
    const photoHeight = photoUrl ? 320 + 16 : 0;

    // Altura total: header(70) + texto + foto(opcional) + stats(50) + footer(40) + paddings
    const H = PAD + 70 + 16 + tweetHeight + 16 + photoHeight + 1 + 50 + 40 + PAD;

    // Canvas definitivo
    const finalCanvas = createCanvas(W, H);
    ctx = finalCanvas.getContext('2d');

    // ── Fondo ──────────────────────────────────────────────────────────────
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // ── Card con bordes redondeados (simulado) ──────────────────────────────
    ctx.fillStyle = C.card;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 16);
    ctx.fill();

    let y = PAD;

    // ── Logo X en la esquina superior derecha ───────────────────────────────
    drawXLogo(ctx, W - PAD, y + 20, 22);

    // ── Avatar circular ─────────────────────────────────────────────────────
    const avatarSize = 48;
    const avatarX = PAD;
    const avatarY = y;

    try {
        const res  = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 6000 });
        const img  = await loadImage(Buffer.from(res.data));
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch {
        // Fallback: círculo azul con inicial
        ctx.save();
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px NotoSans';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((displayName[0] || '?').toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    // ── Nombre y @usuario ───────────────────────────────────────────────────
    const nameX = avatarX + avatarSize + 12;
    ctx.fillStyle = C.text;
    ctx.font = 'bold 16px NotoSans';
    ctx.textAlign = 'left';
    ctx.fillText(displayName, nameX, y + 18);

    // Badge de verificación
    const nameWidth = ctx.measureText(displayName).width;
    drawVerified(ctx, nameX + nameWidth + 4, y + 18);

    ctx.fillStyle = C.muted;
    ctx.font = '14px NotoSans';
    ctx.fillText(`@${username}`, nameX, y + 38);

    y += avatarSize + 16;

    // ── Contenido del tweet ─────────────────────────────────────────────────
    ctx.fillStyle = C.text;
    ctx.font = '18px NotoSans';
    ctx.textAlign = 'left';
    for (const line of tweetLines) {
        ctx.fillText(line, PAD, y);
        y += 26;
    }

    y += 16;

    // ── Foto adjunta (si existe) ─────────────────────────────────────────────
    if (photoUrl) {
        try {
            const res   = await axios.get(photoUrl, { responseType: 'arraybuffer', timeout: 10000 });
            const photo = await loadImage(Buffer.from(res.data));

            const imgW   = W - PAD * 2;
            const imgH   = 300;
            const imgX   = PAD;
            const imgY   = y;
            const radius = 12;

            // Recorte con bordes redondeados
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(imgX + radius, imgY);
            ctx.lineTo(imgX + imgW - radius, imgY);
            ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + radius);
            ctx.lineTo(imgX + imgW, imgY + imgH - radius);
            ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - radius, imgY + imgH);
            ctx.lineTo(imgX + radius, imgY + imgH);
            ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - radius);
            ctx.lineTo(imgX, imgY + radius);
            ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
            ctx.closePath();
            ctx.clip();

            // Calcular recorte proporcional (object-fit: cover)
            const scaleX = imgW / photo.width;
            const scaleY = imgH / photo.height;
            const scale  = Math.max(scaleX, scaleY);
            const drawW  = photo.width  * scale;
            const drawH  = photo.height * scale;
            const offX   = imgX + (imgW - drawW) / 2;
            const offY   = imgY + (imgH - drawH) / 2;

            ctx.drawImage(photo, offX, offY, drawW, drawH);
            ctx.restore();

            y += imgH + 16;
        } catch (e) {
            // Si falla cargar la foto, continuar sin ella
        }
    }

    // ── Timestamp ───────────────────────────────────────────────────────────
    ctx.fillStyle = C.muted;
    ctx.font = '13px NotoSans';
    ctx.fillText(`${timestamp} · Twitter para Discord`, PAD, y);
    y += 16;

    // ── Línea divisora ──────────────────────────────────────────────────────
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += 18;

    // ── Estadísticas ────────────────────────────────────────────────────────
    const statFont = '14px NotoSans';

    function drawStat(icon, value, x, color = C.muted) {
        ctx.fillStyle = color;
        ctx.font = statFont;
        ctx.textAlign = 'left';
        ctx.fillText(`${icon}  ${value}`, x, y);
    }

    const statSpacing = 140;
    drawStat('💬', formatNum(Math.floor(Math.random() * 200)),      PAD,                 C.muted);
    drawStat('🔁', formatNum(retweets),                             PAD + statSpacing,   C.muted);
    drawStat('❤️',  formatNum(likes),                               PAD + statSpacing * 2, C.heart);
    drawStat('📊', formatNum(views),                                PAD + statSpacing * 3, C.muted);

    return finalCanvas.toBuffer('image/png');
}

function formatNum(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
    return String(n);
}

module.exports = { generateTweetImage };
