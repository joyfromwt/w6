import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import TextArt from './TextArt';
import { MagnifyingGlassLabel } from './styles';

const MAGNIFY_FACTOR = 3.5;
const CURSOR_WIDTH = 170;
const CURSOR_HEIGHT = 120;
const OVERLAY_COLOR = '#ff4097';
const MARK_SIZE = 4;
const MAGNIFYING_GLASS_SIZE_PX = 170;

const ContentWrapper = styled.div`
  position: absolute;
  transform-origin: 0 0;
  will-change: transform, left, top;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const InnerCardView = styled.div`
  width: ${props => props.cardWidth}px;
  height: ${props => props.cardHeight}px;
  position: relative;
  background: rgba(0,0,0,0);
  border-radius: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

function FocusOverlay() {
  const WIDTH = CURSOR_WIDTH;
  const HEIGHT = CURSOR_HEIGHT;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;
  const GAP = 32;
  const CORNER = 6;
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      fill="none"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    >
      {/* 중앙 원 */}
      <circle cx={CENTER_X} cy={CENTER_Y} r={GAP} stroke={OVERLAY_COLOR} strokeWidth={0.5} />
      {/* 중앙 작은 사각형 */}
      <rect x={CENTER_X-6} y={CENTER_Y-6} width={12} height={12} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill="none" />
      {/* 네 꼭짓점 6x6 사각형 */}
      <rect x={0} y={0} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={WIDTH-CORNER} y={0} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={0} y={HEIGHT-CORNER} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={WIDTH-CORNER} y={HEIGHT-CORNER} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      {/* 네 변의 중간 6x6 사각형 (흰색이면 opacity 0) */}
      <rect x={CENTER_X-CORNER/2} y={0} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={CENTER_X-CORNER/2} y={HEIGHT-CORNER} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={0} y={CENTER_Y-CORNER/2} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
      <rect x={WIDTH-CORNER} y={CENTER_Y-CORNER/2} width={CORNER} height={CORNER} stroke={OVERLAY_COLOR} strokeWidth={0.5} fill={OVERLAY_COLOR} />
    </svg>
  );
}

export default function MagnifyingGlassContent({ hoveredCardDetails, customCursorPosition }) {
  if (!hoveredCardDetails || !hoveredCardDetails.project) {
    return null;
  }

  const { project, relativeX, relativeY, cardWidth, cardHeight } = hoveredCardDetails;
  const magnifiedFocusX = relativeX * MAGNIFY_FACTOR;
  const magnifiedFocusY = relativeY * MAGNIFY_FACTOR;
  const contentLeft = (CURSOR_WIDTH / 2) - magnifiedFocusX;
  const fontSizePx = 0.6 * 16; // 0.6rem × 16px = 9.6px
  const textArtLines = hoveredCardDetails.linesLength || 40; // lines.length를 전달받는다고 가정, 없으면 40
  const textArtHeight = textArtLines * fontSizePx;
  const magnifiedImgHeight = cardHeight * MAGNIFY_FACTOR;
  const centerDiff = (textArtHeight / 2) - (magnifiedImgHeight / 2);
  const contentTop = (CURSOR_HEIGHT / 2) - magnifiedFocusY + centerDiff + 580 - 100;

  return (
    <div style={{ position: 'relative', width: CURSOR_WIDTH, height: CURSOR_HEIGHT }}>
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
        <TextArt
          src={hoveredCardDetails.project.image}
          fontSize="1.2rem"
          baseSize={80}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      </ContentWrapper>
      <FocusOverlay />
      <MagnifyingGlassLabel
        fontFamily={'G2ErikaMono-Medium'}
        style={{
          left: `${customCursorPosition.x}px`,
          top: `${customCursorPosition.y - (MAGNIFYING_GLASS_SIZE_PX / 2) - 5}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        it seems like...
      </MagnifyingGlassLabel>
    </div>
  );
} 