const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

registerFont(path.join(__dirname, '../fonts/NotoSans-Regular.ttf'), { family: 'NotoSans' });
registerFont(path.join(__dirname, '../fonts/NotoSans-Bold.ttf'), { family: 'NotoSans', weight: 'bold' });

const W = 1100;
const H = 500;

const STYLES = {
    bw:    { bg: '#000000', textColor: '#ffffff', subColor: '#cccccc', waterColor: '#888888', grayscale: true,  label: '⬛ B&N'   },
    color: { bg: '#0d0d0d', textColor: '#ffffff', subColor: '#7289da', waterColor: '#555577', grayscale: false, label: '🎨 Color' },
};

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
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
    if (text.length <= 40)  return 52;
    if (text.length <= 80)  return 42;
    if (text.length <= 140) return 34;
    if (text.length <= 200) return 28;
    return 24;
}

// Convierte los pixeles del canvas a escala de grises en una zona dada
function applyGrayscale(ctx, x, y, w, h) {
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
    }
    ctx.putImageData(imageData, x, y);
}

async function generateQuoteImage(text, username, avatarURL, style = 'bw') {
    const s = STYLES[style] || STYLES.bw;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // ── Fondo base negro ────────────────────────────────────────────────────
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, W, H);

    // ── Avatar en el lado izquierdo ─────────────────────────────────────────
    const avatarZoneW = Math.floor(W * 0.42); // ~462px

    try {
        const resp = await axios.get(avatarURL + '?size=512', { responseType: 'arraybuffer', timeout: 8000 });
        const img  = await loadImage(Buffer.from(resp.data));

        // Dibujar avatar cubriendo toda la zona izquierda
        ctx.drawImage(img, 0, 0, avatarZoneW, H);

        // Convertir a escala de grises si es estilo B&N
        if (s.grayscale) {
            applyGrayscale(ctx, 0, 0, avatarZoneW, H);
        }
    } catch {
        // Si falla, zona izquierda con color
        ctx.fillStyle = s.grayscale ? '#333333' : '#1a1f2e';
        ctx.fillRect(0, 0, avatarZoneW, H);
    }

    // ── Degradado de la imagen hacia el fondo oscuro (efecto "fade") ────────
    const fadeGrad = ctx.createLinearGradient(0, 0, avatarZoneW, 0);
    fadeGrad.addColorStop(0,    s.bg + '00'); // izquierda: transparente
    fadeGrad.addColorStop(0.45, s.bg + '44');
    fadeGrad.addColorStop(0.75, s.bg + 'cc');
    fadeGrad.addColorStop(1,    s.bg + 'ff'); // derecha: sólido
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 0, avatarZoneW, H);

    // ── Zona de texto (lado derecho) ────────────────────────────────────────
    const textX     = avatarZoneW + 55;
    const textZoneW = W - textX - 45;

    // ── Texto de la cita ────────────────────────────────────────────────────
    const fontSize = chooseFontSize(text);
    ctx.font      = `${fontSize}px NotoSans`;
    ctx.fillStyle = s.textColor;
    ctx.shadowColor   = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur    = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    const lines  = wrapText(ctx, stripUnsupported(text), textZoneW);
    const lineH  = fontSize * 1.5;
    const totalTextH = lines.length * lineH;

    // Calcular zona vertical reservando espacio para username abajo
    const bottomReserve = 90;
    const zoneH  = H - bottomReserve;
    let textY    = (zoneH - totalTextH) / 2 + fontSize;

    for (const line of lines) {
        ctx.fillText(line, textX, textY);
        textY += lineH;
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;

    // ── Nombre de usuario ───────────────────────────────────────────────────
    const nameY = H - bottomReserve + 42;

    ctx.font      = 'bold 24px NotoSans';
    ctx.fillStyle = s.subColor;
    ctx.fillText(`- ${stripUnsupported(username)}`, textX, nameY);

    // ── Handle @usuario ─────────────────────────────────────────────────────
    ctx.font      = '18px NotoSans';
    ctx.fillStyle = s.subColor + 'aa';
    ctx.fillText(`@${stripUnsupported(username).toLowerCase().replace(/\s+/g, '')}`, textX, nameY + 28);

    // ── Marca de agua inferior derecha ──────────────────────────────────────
    ctx.font      = '16px NotoSans';
    ctx.fillStyle = s.waterColor;
    const wm  = 'Soledad \u2665';
    const wmW = ctx.measureText(wm).width;
    ctx.fillText(wm, W - wmW - 24, H - 20);

    return canvas.toBuffer('image/png');
}

module.exports = { generateQuoteImage, STYLES };
