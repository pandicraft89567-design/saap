const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

registerFont(path.join(__dirname, '../fonts/NotoSans-Regular.ttf'), { family: 'NotoSans' });
registerFont(path.join(__dirname, '../fonts/NotoSans-Bold.ttf'), { family: 'NotoSans', weight: 'bold' });

const W = 1000;
const H = 520;

const STYLES = {
    bw:    { bg1: '#000000', bg2: '#2c2c2c', accent: '#ffffff', textColor: '#f5f5f5', label: '⬛ B&N'    },
    color: { bg1: '#0d1117', bg2: '#1a1f2e', accent: '#7289da', textColor: '#e6edf3', label: '🎨 Color'  },
};

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line    = '';

    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// Elimina emojis y caracteres no soportados por NotoSans
function stripUnsupported(str) {
    return str
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/\uFE0F/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function chooseFontSize(text) {
    if (text.length <= 60)  return 38;
    if (text.length <= 120) return 32;
    if (text.length <= 200) return 26;
    return 22;
}

async function generateQuoteImage(text, username, avatarURL, style = 'dark') {
    const s = STYLES[style] || STYLES.dark;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // ── Fondo con gradiente radial ──────────────────────────────────────────
    const grad = ctx.createRadialGradient(W * 0.35, H * 0.4, 0, W * 0.5, H * 0.5, W * 0.75);
    grad.addColorStop(0,   s.bg2);
    grad.addColorStop(1,   s.bg1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── Borde decorativo redondeado ─────────────────────────────────────────
    const R = 18;
    ctx.strokeStyle = s.accent;
    ctx.lineWidth   = 2.5;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(R, 22);
    ctx.lineTo(W - R, 22);
    ctx.quadraticCurveTo(W - 22, 22, W - 22, R + 22);
    ctx.lineTo(W - 22, H - R - 22);
    ctx.quadraticCurveTo(W - 22, H - 22, W - R - 22, H - 22);
    ctx.lineTo(R + 22, H - 22);
    ctx.quadraticCurveTo(22, H - 22, 22, H - R - 22);
    ctx.lineTo(22, R + 22);
    ctx.quadraticCurveTo(22, 22, R + 22, 22);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Barra de acento izquierda ───────────────────────────────────────────
    const barGrad = ctx.createLinearGradient(0, 55, 0, H - 55);
    barGrad.addColorStop(0, s.accent + '00');
    barGrad.addColorStop(0.3, s.accent);
    barGrad.addColorStop(0.7, s.accent);
    barGrad.addColorStop(1, s.accent + '00');
    ctx.fillStyle = barGrad;
    ctx.fillRect(44, 55, 4, H - 110);

    // ── Comilla de apertura ─────────────────────────────────────────────────
    ctx.font      = 'bold 160px NotoSans';
    ctx.fillStyle = s.accent;
    ctx.globalAlpha = 0.18;
    ctx.fillText('"', 54, 195);
    ctx.globalAlpha = 1;

    // ── Texto de la cita ────────────────────────────────────────────────────
    const fontSize = chooseFontSize(text);
    ctx.font      = `${fontSize}px NotoSans`;
    ctx.fillStyle = s.textColor;
    ctx.shadowColor  = '#000000';
    ctx.shadowBlur   = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    const maxW   = W - 160;
    const lines  = wrapText(ctx, text, maxW);
    const lineH  = fontSize * 1.45;
    const totalH = lines.length * lineH;

    // Centrar verticalmente en la zona superior (sin la franja del avatar)
    const zoneTop    = 55;
    const zoneBottom = H - 120;
    const zoneH      = zoneBottom - zoneTop;
    let textY = zoneTop + (zoneH - totalH) / 2 + fontSize;

    for (const line of lines) {
        ctx.fillText(line, 80, textY);
        textY += lineH;
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;

    // ── Comilla de cierre ───────────────────────────────────────────────────
    ctx.font      = 'bold 100px NotoSans';
    ctx.fillStyle = s.accent;
    ctx.globalAlpha = 0.18;
    ctx.fillText('"', W - 120, H - 138);
    ctx.globalAlpha = 1;

    // ── Línea divisoria ─────────────────────────────────────────────────────
    const divY = H - 110;
    const divGrad = ctx.createLinearGradient(60, 0, W - 60, 0);
    divGrad.addColorStop(0,   s.accent + '00');
    divGrad.addColorStop(0.15, s.accent + 'cc');
    divGrad.addColorStop(0.85, s.accent + 'cc');
    divGrad.addColorStop(1,   s.accent + '00');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, divY);
    ctx.lineTo(W - 60, divY);
    ctx.stroke();

    // ── Avatar circular ─────────────────────────────────────────────────────
    const AV = 64;
    const avX = 72, avY = divY + 18;
    try {
        const resp = await axios.get(avatarURL + '?size=128', { responseType: 'arraybuffer', timeout: 8000 });
        const img  = await loadImage(Buffer.from(resp.data));

        // Anillo de acento
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + AV / 2, avY + AV / 2, AV / 2 + 3, 0, Math.PI * 2);
        ctx.fillStyle = s.accent;
        ctx.fill();
        ctx.restore();

        // Clip circular
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + AV / 2, avY + AV / 2, AV / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avX, avY, AV, AV);
        ctx.restore();
    } catch {
        ctx.beginPath();
        ctx.arc(avX + AV / 2, avY + AV / 2, AV / 2, 0, Math.PI * 2);
        ctx.fillStyle = s.accent;
        ctx.fill();
    }

    // ── Nombre de usuario ───────────────────────────────────────────────────
    ctx.font      = 'bold 22px NotoSans';
    ctx.fillStyle = s.accent;
    ctx.fillText(`— ${stripUnsupported(username)}`, avX + AV + 18, avY + AV / 2 + 8);

    // ── Marca de agua ───────────────────────────────────────────────────────
    ctx.font      = '18px NotoSans';
    ctx.fillStyle = s.accent + '99';
    const wm = 'Soledad \u2665';
    const wmW = ctx.measureText(wm).width;
    ctx.fillText(wm, W - wmW - 38, avY + AV / 2 + 8);

    return canvas.toBuffer('image/png');
}

module.exports = { generateQuoteImage, STYLES };
