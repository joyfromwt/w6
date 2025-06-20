import styled, { createGlobalStyle } from 'styled-components';

export const ErikaMonoFont = createGlobalStyle`
  @font-face {
    font-family: 'G2ErikaMono-Medium';
    src: url('/G2ErikaMono-Medium.woff2') format('woff2'),
         url('/G2ErikaMono-Medium.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`;

export const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #A8A8A8;
  position: relative;
`;

export const Header = styled.header`
  margin-bottom: 0rem;
  text-align: center;
  max-width: 1400px;
  width: 100%;
  position: relative;
  z-index: 1;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: #A8A8A8;
  margin-top: 105px;
  margin-bottom: 0.5rem;
  margin-left: 120px;
  margin-right: 0;
  text-shadow: 0 0 0px rgba(168, 168, 168, 0.2);
  letter-spacing: 0px;
  -webkit-font-smoothing: antialiased;
  opacity: 1;
  max-width: 900px;
  text-align: left;
  font-family: 'G2ErikaMono-Medium';
`;

export const Subtitle = styled.p`
  font-family: 'G2ErikaMono-Medium';
  font-size: 0.9rem;
  color: #A8A8A8;
  margin: 0.5rem 0 0 120px;
  letter-spacing: 0.5px;
  opacity: 0.8;
  max-width: 600px;
  width: 100%;
  text-align: left;
  min-height: 100px;
`;

export const Section = styled.section`
  width: 100%;
  max-width: 1400px;
  margin: 6rem 0;
  padding: 0 1rem;
  position: relative;
  height: auto;
  overflow: visible;
  &:hover {
    cursor: none;
  }
`;

export const ProjectCard = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  background: transparent;
  border-radius: 10px;
  user-select: none;
  touch-action: none;
  transition: transform 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;

  h3 {
    position: absolute;
    top: calc(50% - 80px);
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    color: #A8A8A8;
    font-size: 14px;
    z-index: 2;
    font-family: 'G2ErikaMono-Medium';
    text-align: center;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    transition: opacity 0.3s ease;
  }
`;

export const TextCursor = styled.div`
  position: fixed;
  font-size: 1.0rem;
  color: #A8A8A8;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 10000;
  white-space: nowrap;
  font-family: 'G2ErikaMono-Medium';
`;

export const RulerContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35px;
  pointer-events: none;
  font-family: inherit;

  ${({ side }) => side === 'left' ? `left: 0;` : `right: 0;`}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: rgba(255, 255, 255, 0.3);
    ${({ side }) => side === 'left' ? `right: 0;` : `left: 0;`}
  }
`;

export const RulerTick = styled.div`
  position: absolute;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.6);
  width: ${({ major }) => major ? '15px' : '8px'};
  top: ${({ yPos }) => yPos}%;

  ${({ side }) => side === 'left' ? 
    `right: 0;`
    :
    `left: 0;`
  }
`;

export const RulerLabel = styled.span`
  position: absolute;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.6rem;
  top: ${({ yPos }) => yPos}%;
  transform: translateY(-50%);

  ${({ side }) => side === 'left' ? 
    `right: 20px;`
    :
    `left: 20px;`
  }
`;

export const WebcamWrapper = styled.div`
  position: fixed;
  top: 153px;
  right: 115px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
`;

export const WebcamContainer = styled.div`
  width: 350px;
  height: 175px;
  background-color: #000;
  border: 0.5px solid #FFF;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden; /* 비디오가 컨테이너를 넘어갈 경우 숨김 */
  position: relative; /* For canvas positioning */

  /* 텍스트 중앙 정렬을 위한 스타일 추가 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-family: 'G2ErikaMono-Medium', monospace;
  font-size: 1rem;

  video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

export const WebcamLabelTop = styled.div`
  width: 300px;
  padding-bottom: 5px; /* 하단 컨테이너와의 간격 */
  padding-left: 5px;
  color: #A8A8A8;
  font-size: 0.8rem;
  text-align: left;
  pointer-events: none;
  font-family: 'G2ErikaMono-Medium';
`;

export const WebcamLabel = styled.div`
  width: 300px; /* WebcamContainer와 동일한 width 값 */
  padding-top: 5px; /* 상단 컨테이너와의 간격 */
  padding-left: 5px; /* 좌측 여백 약간 추가 */
  color: #A8A8A8;
  font-size: 0.8rem;
  text-align: left;
  pointer-events: none;
  font-family: 'G2ErikaMono-Medium';
  div {
    margin-bottom: 0.2rem; /* 줄 간격 */
  }
`;

export const NextButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 115px;
  background-color: #000;
  color: white;
  border: 1px solid #FFF;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 0;
  z-index: 1002;
  font-family: 'G2ErikaMono-Medium', monospace;

  &:hover {
    background-color: #FFF;
    color: #000;
  }
`;

export const AllCardsDroppedPopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; 

  .word-item {
    font-size: 0.8rem;
    color: #A8A8A8;
    margin: 0 10px;
    opacity: 0.4;
    transition: opacity 0.5s ease;

    &.highlight {
      color: #FFD700;
    }
  }

  &.popup-visible .word-item {
    opacity: 1;
  }
`;

export const AllCardsDroppedPopupContent = styled.div`
  background-color: #000;
  padding: 40px;
  border: 1px solid #FFF;
  border-radius: 0;
  color: #FFF;
  font-family: 'G2ErikaMono-Medium', monospace;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  max-width: 80%;

  .main-content-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 30px;
    position: relative;
  }

  .popup-image-wrapper {
    position: relative;
    width: 300px;
    height: auto;
    background-color: transparent;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .line-svg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .popup-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .random-square {
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: transparent;
    border: 0.5px solid #FFF;
  }

  .grid-container {
    display: grid;
    grid-template-columns: 100px;
    grid-template-rows: repeat(2, 100px);
    gap: 10px;
  }

  .grid-square {
    width: 100px;
    height: 100px;
    border: 0.5px solid #FFF;
    background-color: transparent;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .words-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5em 1em;
    justify-content: center;
  }

  .word-item {
    font-size: 0.9rem;
    color: #FFF;
    transition: color 0.3s ease-in-out;
  }

  .word-item.highlight {
    color: #FFD700;
  }
`;

export const ProjectPopupContainer = styled.div`
  position: fixed;
  // ... existing code ...
`;