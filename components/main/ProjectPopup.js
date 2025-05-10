import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Image from 'next/image';

const Overlay = styled.div`
  position: fixed;
  left: 0; top: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); z-index: 20000; display: flex; align-items: center; justify-content: center;
`;

const Popup = styled.div`
  background: #111; color: #fff; border-radius: 0; padding: 2rem; min-width: 500px; min-height: 350px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  display: flex; flex-direction: column; align-items: center;
  font-family: 'G2ErikaMono-Medium';
`;

const ButtonRow = styled.div`
  display: flex; gap: 1.5rem; margin-top: 2rem;
`;

const PopupButton = styled.button`
  background: #111;
  color: #fff;
  border: 1px solid #111;
  border-radius: 0;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  font-family: 'G2ErikaMono-Medium';
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #fff;
    color: #111;
  }
`;

const ProjectImage = styled.div`
  width: 220px;
  height: 220px;
  margin: 1.5rem 0 0.5rem 0;
  border-radius: 10px;
  overflow: hidden;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TEXT_ART_WIDTH = 40;
const TEXT_ART_HEIGHT = 40;

function getRandomChar() {
  const chars = ['0', '1', '*'];
  return chars[Math.floor(Math.random() * chars.length)];
}

function getTextArtFromImage(imgSrc, callback) {
  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.src = imgSrc;
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = TEXT_ART_WIDTH;
    canvas.height = TEXT_ART_HEIGHT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, TEXT_ART_WIDTH, TEXT_ART_HEIGHT);
    const data = ctx.getImageData(0, 0, TEXT_ART_WIDTH, TEXT_ART_HEIGHT).data;
    let lines = [];
    for (let y = 0; y < TEXT_ART_HEIGHT; y++) {
      let line = '';
      for (let x = 0; x < TEXT_ART_WIDTH; x++) {
        const idx = (y * TEXT_ART_WIDTH + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        // 밝기 계산 (투명도도 고려)
        const brightness = (r + g + b) / 3;
        if (a > 128 && brightness < 220) {
          line += getRandomChar();
        } else {
          line += ' ';
        }
      }
      lines.push(line);
    }
    callback(lines);
  };
}

function TextArt({ src }) {
  const [lines, setLines] = useState([]);
  const [hoverPos, setHoverPos] = useState(null); // {row, col}
  const preRef = useRef();

  useEffect(() => {
    if (!src) return;
    getTextArtFromImage(src, setLines);
  }, [src]);

  // 마우스 위치를 행/열로 변환
  const handleMouseMove = (e) => {
    if (!preRef.current) return;
    const rect = preRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / (rect.width / TEXT_ART_WIDTH));
    const row = Math.floor(y / (rect.height / TEXT_ART_HEIGHT));
    setHoverPos({ row, col });
  };
  const handleMouseLeave = () => setHoverPos(null);

  // 거리 기반 opacity 계산
  function getOpacity(row, col) {
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
        fontSize: '0.9rem',
        lineHeight: '0.9rem',
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
        cursor: 'pointer',
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
}

export default function ProjectPopup({ open, onClose, onMore, project }) {
  if (!open || !project) return null;
  return (
    <Overlay>
      <Popup>
        <h2>{project.title}</h2>
        {project.image && (
          <Image
            src={project.image}
            alt={project.title}
            width={340}
            height={340}
            style={{ objectFit: 'cover', display: 'block', margin: '2rem auto 1rem auto' }}
          />
        )}
        <ButtonRow>
          <PopupButton onClick={onClose}>back</PopupButton>
          <PopupButton onClick={onMore}>more</PopupButton>
        </ButtonRow>
      </Popup>
    </Overlay>
  );
} 