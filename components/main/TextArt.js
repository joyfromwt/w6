import React, { useEffect, useRef, useState } from 'react';

const BASE_SIZE = 40;
const textArtCache = new Map();

function getRandomChar() {
  const chars = ['0', '1', '*'];
  return chars[Math.floor(Math.random() * chars.length)];
}

function getTextArtFromImage(imgSrc, callback) {
  if (textArtCache.has(imgSrc)) {
    callback(textArtCache.get(imgSrc));
    return;
  }
  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.src = imgSrc;
  img.onload = function () {
    const aspect = img.width / img.height;
    let width, height;
    if (aspect >= 1) {
      width = BASE_SIZE;
      height = Math.round(BASE_SIZE * (img.height / img.width));
    } else {
      height = BASE_SIZE;
      width = Math.round(BASE_SIZE * (img.width / img.height));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    let lines = [];
    for (let y = 0; y < height; y++) {
      let line = '';
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        const brightness = (r + g + b) / 3;
        if (a > 128 && brightness < 220) {
          line += getRandomChar();
        } else {
          line += ' ';
        }
      }
      lines.push(line);
    }
    textArtCache.set(imgSrc, lines);
    callback(lines);
  };
}

const TextArt = React.memo(function TextArt({ src, hoverEffect = true, fontSize = '0.9rem' }) {
  const [lines, setLines] = useState([]);
  const [hoverPos, setHoverPos] = useState(null); // {row, col}
  const preRef = useRef();

  useEffect(() => {
    let cancelled = false;
    if (!src) return;
    getTextArtFromImage(src, (lines) => {
      if (!cancelled) setLines(lines);
    });
    return () => { cancelled = true; };
  }, [src]);

  // 마우스 위치를 행/열로 변환
  const handleMouseMove = (e) => {
    if (!hoverEffect || !preRef.current) return;
    const rect = preRef.current.getBoundingClientRect();
    const width = lines[0]?.length || 1;
    const height = lines.length || 1;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / (rect.width / width));
    const row = Math.floor(y / (rect.height / height));
    setHoverPos({ row, col });
  };
  const handleMouseLeave = () => setHoverPos(null);

  // 거리 기반 opacity 계산
  function getOpacity(row, col) {
    if (!hoverEffect) return 0.6;
    if (!hoverPos) return 0.5;
    const dx = hoverPos.col - col;
    const dy = hoverPos.row - row;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // 중심에서 가까울수록 더 투명하게, 멀수록 더 진하게
    return Math.min(0.2 + dist / 10, 1);
  }

  return (
    <pre
      ref={preRef}
      style={{
        fontFamily: 'G2ErikaMono-Medium',
        fontSize: fontSize,
        lineHeight: fontSize,
        margin: '2rem auto 1rem auto',
        textAlign: 'center',
        letterSpacing: '0.1em',
        background: 'transparent',
        width: 'fit-content',
        minWidth: 'unset',
        maxWidth: 'unset',
        padding: 0,
        border: 'none',
        userSelect: 'none',
        cursor: hoverEffect ? 'pointer' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {lines.map((line, rowIdx) => (
        <span key={rowIdx}>
          {Array.from(line).map((ch, colIdx) => (
            <span
              key={colIdx}
              style={{ opacity: getOpacity(rowIdx, colIdx), transition: 'opacity 0.1s' }}
            >
              {ch}
            </span>
          ))}
          <br/>
        </span>
      ))}
    </pre>
  );
});

export default TextArt; 