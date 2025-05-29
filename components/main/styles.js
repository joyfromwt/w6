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
  background-color: #000;
  color: #A8A8A8;
  position: relative;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size: 150px 150px;
`;

export const Header = styled.header`
  margin-bottom: 0rem;
  text-align: center;
  max-width: 1400px;
  width: 100%;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: #A8A8A8;
  margin-top: 105px;
  margin-bottom: 0.5rem;
  margin-left: 100px;
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
  margin: 0.5rem 0 0 100px;
  letter-spacing: 0.5px;
  opacity: 0.8;
  max-width: 600px;
  width: 100%;
  text-align: left;
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
  align-items: center;

  h3 {
    position: absolute;
    top: 10px;
    left: 10px;
    margin: 0;
    color: #A8A8A8;
    font-size: 14px;
    z-index: 2;
    font-family: 'G2ErikaMono-Medium';
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    transition: opacity 0.3s ease;
  }
`;

export const MagnifyingGlassContainer = styled.div`
  position: fixed;
  width: 170px;
 height: 120px;
  border: 1px solid rgba(255,64,151,0);
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
  overflow: hidden;
  /* background-color: rgba(255, 255, 255, 0.1); */
  /* backdrop-filter: blur(5px); */
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const MagnifyingGlassContent = styled.div`
  /* 이 부분은 MagnifyingGlassContent.js 파일로 관리되므로, 
     여기서는 기본적인 플레이스홀더만 남기거나 비워둘 수 있습니다. 
     하지만 이전 상태에서는 여기에 내용이 없었습니다. */
`;

export const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  justify-content: center;
`;

export const Link = styled.a`
  color: #A8A8A8;
  text-decoration: none;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 0;
  background: transparent;
  letter-spacing: 1px;

  &:hover {
    color: #A8A8A8;
    background: #F8F8F8;
    transform: translateY(-2px);
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

export const MagnifyingGlassLabel = styled.div`
  position: fixed;
  font-size: 1.0rem;
  color: #ff4097;
  font-family: 'G2ErikaMono-Medium';
  pointer-events: none;
  white-space: nowrap;
  z-index: 10000;
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

export const MagnifiedImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
`;