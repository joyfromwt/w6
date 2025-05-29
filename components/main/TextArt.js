import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const BASE_SIZE = 30;
const textArtCache = new Map();
const opacityCache = new Map();

function getRandomChar() {
  const chars = ['0', '1', '*'];
  return chars[Math.floor(Math.random() * chars.length)];
}

// 이미지 데이터를 텍스트 아트로 변환하는 함수를 메모이제이션
const processImageData = (data, width, height) => {
  let lines = [];
  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      const brightness = (r + g + b) / 3;
      if (a > 32 && brightness < 245) {
        line += getRandomChar();
      } else {
        line += ' ';
      }
    }
    lines.push(line);
  }
  return lines;
};

function getTextArtFromImage(imgSrc, callback, baseSize, fontSize) {
  const cacheKey = `${imgSrc}|${baseSize}|${fontSize}`;
  if (textArtCache.has(cacheKey)) {
    callback(textArtCache.get(cacheKey));
    return;
  }

  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.src = imgSrc;
  img.onload = function () {
    const aspect = img.width / img.height;
    let width, height;
    if (aspect >= 1) {
      width = Math.max(baseSize, 8);
      height = Math.max(Math.round(baseSize / aspect), 8);
    } else {
      height = Math.max(baseSize, 8);
      width = Math.max(Math.round(baseSize * aspect), 8);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    const lines = processImageData(data, width, height);
    textArtCache.set(cacheKey, lines);
    callback(lines);
  };
}

const TextArt = React.memo(function TextArt({ src, hoverEffect = true, fontSize = '0.9rem', baseSize = 30, style }) {
  const [lines, setLines] = useState([]);
  const [hoverPos, setHoverPos] = useState(null);
  const preRef = useRef();
  const rafRef = useRef();

  useEffect(() => {
    let cancelled = false;
    if (!src) return;
    getTextArtFromImage(src, (lines) => {
      if (!cancelled) {
        setLines(lines);
      }
    }, baseSize, fontSize);
    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [src, baseSize, fontSize]);

  const handleMouseMove = useCallback((e) => {
    if (!hoverEffect || !preRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      const rect = preRef.current.getBoundingClientRect();
      const width = lines[0]?.length || 1;
      const height = lines.length || 1;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / (rect.width / width));
      const row = Math.floor(y / (rect.height / height));
      setHoverPos({ row, col });
    });
  }, [hoverEffect, lines]);

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const getOpacity = useCallback((row, col) => {
    if (!hoverEffect) return 0.6;
    if (!hoverPos) return 0.5;
    const dx = hoverPos.col - col;
    const dy = hoverPos.row - row;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return Math.min(0.2 + dist / 10, 1);
  }, [hoverEffect, hoverPos]);

  const preStyle = useMemo(() => ({
    fontFamily: 'G2ErikaMono-Medium',
    fontSize: fontSize,
    lineHeight: fontSize,
    margin: '0.5rem auto',
    textAlign: 'center',
    letterSpacing: '0.1em',
    background: 'transparent',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    ...style,
  }), [fontSize, style]);

  const renderLines = useMemo(() => (
    lines.map((line, rowIdx) => (
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
    ))
  ), [lines, getOpacity]);

  return (
    <pre
      ref={preRef}
      style={preStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {renderLines}
    </pre>
  );
});

TextArt.displayName = 'TextArt';

export default TextArt; 