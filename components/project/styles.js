import styled from 'styled-components';
import { Space_Mono } from 'next/font/google';

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #000;
  color: #A8A8A8;
  font-family: ${spaceMono.style.fontFamily};
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size: 150px 150px;
  box-sizing: border-box;
  position: relative;
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

export const Content = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
`;

export const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
`;

export const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #FFF;
  font-family: 'G2ErikaMono-Medium';
`;

export const Description = styled.p`
  font-size: 1rem;
  line-height: 1.6;
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 400px;
  position: relative;
  margin-bottom: 2rem;
  border-radius: 8px;
  overflow: hidden;
`;

export const InfoSection = styled.section`
  margin-bottom: 2rem;
`;

export const InfoTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #FFF;
  border-bottom: 1px solid #A8A8A8;
  padding-bottom: 0.5rem;
`;

export const TechStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const TechTag = styled.span`
  background-color: #333;
  color: #FFF;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
`;

export const BackButton = styled.button`
  background-color: #333;
  color: #FFF;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #555;
  }

  &[as="a"] {
    &:hover {
      text-decoration: none;
    }
  }
`; 