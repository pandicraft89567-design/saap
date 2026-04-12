const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const path  = require('path');

const BG_PATH = path.join(__dirname, '../data/ship-bg.png');

const W = 680;
const H = 220;

async function fetchAvatar(url) {
    try {
        const resp = await axios.get(url + '?size=256', { responseType: 'arraybuffer', timeout: 8000 });
        return await loadImage(Buffer.from(resp.data));
    } catch {
        return null;
    }
}

function drawCircleAvatar(ctx, img, cx, cy, r) {
    ctx.save();

    // Sombra exterior
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 12;

    // Anillo blanco/dorado
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();

    ctx.shadowBlur = 0;

    // Clip circular para el avatar
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (img) {
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } else {
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    ctx.restore();
}

async function generateShipImage(avatar1URL, avatar2URL, percent) {
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // ── Fondo de la imagen ────────────────────────────────────────────────
    try {
        const bg = await loadImage(BG_PATH);
        ctx.drawImage(bg, 0, 0, W, H);
    } catch {
        // Fondo degradado si no carga la imagen
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#2d1b3d');
        grad.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── Overlay oscuro central para hacer legible el porcentaje ──────────
    const ovGrad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 180);
    ovGrad.addColorStop(0,   'rgba(0,0,0,0.35)');
    ovGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = ovGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Cargar avatares en paralelo ───────────────────────────────────────
    const [img1, img2] = await Promise.all([
        fetchAvatar(avatar1URL),
        fetchAvatar(avatar2URL),
    ]);

    const R   = 78;   // radio del círculo de avatar
    const cy  = H / 2;

    // Avatar izquierdo (persona 1)
    drawCircleAvatar(ctx, img1, R + 18, cy, R);

    // Avatar derecho (persona 2)
    drawCircleAvatar(ctx, img2, W - R - 18, cy, R);

    // ── Porcentaje en el centro ───────────────────────────────────────────
    const pctText = `${percent}%`;

    ctx.font      = 'bold 62px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra del texto
    ctx.shadowColor   = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur    = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = '#ffffff';
    ctx.fillText(pctText, W / 2, H / 2);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';

    return canvas.toBuffer('image/png');
}

module.exports = { generateShipImage };
