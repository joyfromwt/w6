import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';

const MAGNIFY_FACTOR = 3.5;
const CURSOR_SIZE = 170;
const OVERLAY_COLOR = '#ff4097';
const MARK_SIZE = 4;

const ContentWrapper = styled.div`
  position: absolute;
  transform-origin: 0 0;
  will-change: transform, left, top;
`;

const InnerCardView = styled.div`
  width: ${props => props.cardWidth}px;
  height: ${props => props.cardHeight}px;
  position: relative;
  background: transparent;
  border-radius: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

function FocusOverlay() {
  const SIZE = CURSOR_SIZE;
  const CENTER = SIZE / 2;
  const GAP = 32;
  const CORNER = 32;
  const MARK_COLOR = '#ff4097';
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    >
      {/* 중앙 원 */}
      <circle cx={CENTER} cy={CENTER} r={GAP} stroke={OVERLAY_COLOR} strokeWidth={0.5} />
      {/* 중앙 작은 사각형 */}
      <rect x={CENTER-8} y={CENTER-8} width={12} height={12} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill="none" />
      {/* 네 꼭짓점 10x10 사각형 (중심이 꼭짓점에 오도록, fill 적용) */}
      <rect x={-5} y={-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={SIZE-5} y={-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={-5} y={SIZE-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={SIZE-5} y={SIZE-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      {/* 네 변의 중간 10x10 사각형 (중복 없이 하나씩만) */}
      <rect x={SIZE/2-5} y={-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={SIZE-5} y={SIZE/2-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={SIZE/2-5} y={SIZE-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={-5} y={SIZE/2-5} width={10} height={10} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
    </svg>
  );
}

export default function MagnifyingGlassContent({ hoveredCardDetails }) {
  if (!hoveredCardDetails || !hoveredCardDetails.project) {
    return null;
  }

  const { project, relativeX, relativeY, cardWidth, cardHeight } = hoveredCardDetails;
  const magnifiedFocusX = relativeX * MAGNIFY_FACTOR;
  const magnifiedFocusY = relativeY * MAGNIFY_FACTOR;
  const contentLeft = (CURSOR_SIZE / 2) - magnifiedFocusX;
  const fontSizePx = 0.6 * 16; // 0.6rem × 16px = 9.6px
  const textArtLines = hoveredCardDetails.linesLength || 40; // lines.length를 전달받는다고 가정, 없으면 40
  const textArtHeight = textArtLines * fontSizePx;
  const magnifiedImgHeight = cardHeight * MAGNIFY_FACTOR;
  const centerDiff = (textArtHeight / 2) - (magnifiedImgHeight / 2);
  const contentTop = (CURSOR_SIZE / 2) - magnifiedFocusY + centerDiff + 600;

  return (
    <div style={{ position: 'relative', width: CURSOR_SIZE, height: CURSOR_SIZE }}>
      <ContentWrapper
        style={{
          width: `${cardWidth * MAGNIFY_FACTOR}px`,
          height: `${cardHeight * MAGNIFY_FACTOR}px`,
          left: `${contentLeft}px`,
          top: `${contentTop}px`,
          transform: `scale(${MAGNIFY_FACTOR})`,
        }}
      >
        <InnerCardView cardWidth={cardWidth} cardHeight={cardHeight}>
          {project.image && (
            <Image
              src={project.image}
              alt={project.title}
              fill
            />
          )}
        </InnerCardView>
      </ContentWrapper>
      <FocusOverlay />
    </div>
  );
} 