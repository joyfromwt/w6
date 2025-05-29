import styled from 'styled-components';
// import { Space_Mono } from 'next/font/google'; // G2ErikaMono-Medium 사용을 위해 주석 처리 또는 삭제
import { ErikaMonoFont as MainErikaMonoFont } from '../../components/main/styles'; // ErikaMonoFont import 추가, 이름 변경하여 충돌 방지

export const ErikaMonoFont = MainErikaMonoFont; // ErikaMonoFont export 추가

// const spaceMono = Space_Mono({ // G2ErikaMono-Medium 사용을 위해 주석 처리 또는 삭제
//   weight: ["400", "700"],
//   subsets: ["latin"],
// });

export const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #000;
  color: #A8A8A8;
  font-family: 'G2ErikaMono-Medium', monospace; // ErikaMonoFont 적용
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
  width: 100%; // 추가
  max-width: 900px; // 추가
  margin-left: auto; // 추가
  margin-right: auto; // 추가
`;

export const Title = styled.h1`
  font-size: 2rem; // main/styles.js Title 스타일 적용
  font-weight: 400;
  color: #A8A8A8;
  margin-top: 105px;
  margin-bottom: 0.5rem;
  /* margin-left: 100px; // 프로젝트 페이지에서는 중앙 정렬 또는 다른 값으로 조정 가능 */
  margin-right: 0;
  text-shadow: 0 0 0px rgba(168, 168, 168, 0.2);
  letter-spacing: 0px;
  -webkit-font-smoothing: antialiased;
  opacity: 1;
  /* max-width: 900px; // Header에서 이미 max-width 설정 */
  text-align: center; // 프로젝트 페이지 타이틀은 중앙 정렬
  font-family: 'G2ErikaMono-Medium';
`;

export const Subtitle = styled.p` // Description을 Subtitle로 변경하고 main/styles.js Subtitle 스타일 적용
  font-family: 'G2ErikaMono-Medium';
  font-size: 0.9rem;
  color: #A8A8A8;
  margin: 0.5rem auto 2rem auto; // margin-bottom 조정
  letter-spacing: 0.5px;
  opacity: 0.8;
  max-width: 600px; // Header에서 이미 max-width 설정, 필요시 조정
  width: 100%;
  text-align: center; // 프로젝트 페이지 부제는 중앙 정렬
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
  color: #FFF; // 흰색 유지 또는 #A8A8A8로 변경 가능
  border-bottom: 1px solid #A8A8A8;
  padding-bottom: 0.5rem;
  font-family: 'G2ErikaMono-Medium'; // 폰트 변경
  font-weight: 400; // main Title과 유사하게
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
  font-family: 'G2ErikaMono-Medium'; // 폰트 변경
`;

export const BackButton = styled.a`
  background-color: #333;
  color: #FFF;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 0.9rem;
  font-family: 'G2ErikaMono-Medium'; // 폰트 변경
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