import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const BASE_SIZE = 30;
const textArtCache = new Map();
// const opacityCache = new Map(); // getOpacity 로직 변경으로 더 이상 필요 없을 수 있음. 최종 확인 후 정리.

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

const TextArt = React.memo(function TextArt({ src, hoverEffect = true, fontSize = '0.9rem', baseSize = 30, style, color, opacity = 1 }) {
  const [lines, setLines] = useState([]);
  // const [hoverPos, setHoverPos] = useState(null); // 투명도 효과 제거로 hoverPos 불필요
  const preRef = useRef();
  const rafRef = useRef(); // handleMouseMove에서 사용되나, 투명도 변경 없으므로 최적화 가능성 있음

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

  // handleMouseMove와 handleMouseLeave는 hoverEffect prop에 따라 TextArt 애니메이션을 멈추는
  // MainComponent의 로직과 연동되므로, 이 함수들 자체는 유지하되 내부에서 hoverPos 설정은 제거.
  // 또는 MainComponent에서 hoverEffect prop을 false로 넘기면 이 핸들러들은 호출되지 않음.
  // 현재 MainComponent에서 TextArt의 hoverEffect prop은 애니메이션 제어용도로 사용 중.
  // 따라서 이 함수들은 유지하고, setHoverPos만 제거.
  const handleMouseMove = useCallback((e) => {
    if (!hoverEffect || !preRef.current) return; // hoverEffect가 false면 아무것도 안함 (애니메이션 멈춤)
    // setHoverPos 관련 로직 제거
  }, [hoverEffect, lines]); // lines 의존성 제거 가능

  const handleMouseLeave = useCallback(() => {
    // setHoverPos(null); // 제거
  }, []);

  // getOpacity 함수는 항상 1 (완전 불투명) 또는 고정된 기본값을 반환하도록 수정
  const getOpacity = useCallback(() => {
    return 1; // 모든 글자를 항상 완전 불투명하게 표시
    // 또는 return 0.6; // 기존의 기본 비호버 투명도
  }, []); // 의존성 없음

  const preStyle = useMemo(() => ({
    fontFamily: 'G2ErikaMono-Medium',
    fontSize: fontSize,
    lineHeight: fontSize, // fontSize와 동일하게 하여 줄 간격 조절 용이
    margin: '0.5rem auto',
    textAlign: 'center',
    letterSpacing: '0.1em',
    background: 'transparent',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    color: color || '#A8A8A8',
    opacity: opacity,
    ...style,
  }), [fontSize, style, color, opacity]);

  const renderLines = useMemo(() => (
    lines.map((line, rowIdx) => (
      <span key={rowIdx}>
        {Array.from(line).map((ch, colIdx) => (
          <span
            key={colIdx}
            // opacity는 getOpacity에서 고정값을 받으므로 transition 제거
            style={{ opacity: getOpacity(rowIdx, colIdx) }}
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
      // hoverEffect prop이 MainComponent에서 애니메이션 제어용으로 사용되므로 핸들러는 유지
      onMouseMove={hoverEffect ? handleMouseMove : null} 
      onMouseLeave={hoverEffect ? handleMouseLeave : null}
    >
      {renderLines}
    </pre>
  );
});

TextArt.displayName = 'TextArt';

export default TextArt; 