import React, { useEffect, useState, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { ErikaMonoFont } from '../components/main/styles';
import { RulerContainer, RulerTick, RulerLabel } from '../components/main/styles';
import { useResize } from '../utils/hooks/useResize';
import ParticleAnimation from '../components/more/ParticleAnimation';

// --- styles/more.js의 내용을 여기에 통합 ---
const PageContainer = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #000;
  color: #A8A8A8;
  position: relative;
  font-family: 'G2ErikaMono-Medium', monospace;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 150px 150px;
`;

const FlexContainer = styled.div`
  display: flex;
  width: 100%;
  height: calc(100vh - 4rem);
  align-items: center;
  gap: 2rem;
`;

const LeftColumn = styled.div`
  flex: 4;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const RightColumn = styled.div`
  flex: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 15vh;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 400;
  color: #A8A8A8;
  margin-top: 0;
  margin-bottom: 2rem;
  text-align: left;
  font-family: 'G2ErikaMono-Medium';
`;

const ContentWrapper = styled.div`
  width: 100%;
  padding: 2rem;
  border: none;
  background: transparent;
`;

const ArtifactPreviewContainer = styled.div`
  width: 100%;
  padding: 2rem;
  border: 1px solid #333;
  background: #0C0C0C;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
`;

const ArtifactTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 400;
  color: #A8A8A8;
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: left;
  font-family: 'G2ErikaMono-Medium';
`;

const ArtifactImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
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
    background-color: #333;
  }
`;

const SliderInput = styled.input`
  width: 80%;
  margin-top: 4rem;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 2px;
    cursor: pointer;
    background: #ffffff;
    border-radius: 1px;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: 1px solid #ffffff;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    margin-top: -7px; /* thumb의 y축 위치를 트랙 중앙으로 조정 */
  }

  &::-moz-range-track {
    width: 100%;
    height: 2px;
    cursor: pointer;
    background: #ffffff;
    border-radius: 1px;
  }

  &::-moz-range-thumb {
    border: 1px solid #ffffff;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
  }
`;
// --- 통합 끝 ---

const GridContainer = styled.div`
    width: 100%;
    display: grid;
    gap: 2px;
    background-color: transparent; /* 배경 제거 */
    grid-template-columns: repeat(auto-fill, 20px);
    grid-auto-rows: 30px;
    justify-content: start; /* 정렬을 왼쪽으로 변경 */
    box-sizing: border-box;
`;

const CharacterCell = styled.span`
  color: ${props => props.revealed ? '#FFFFFF' : '#A8A8A8'};
  transition: color 0.3s ease;
  width: 20px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  text-align: center;
  user-select: none;
`;

// --- Animation Settings ---
const SLOT_ANIMATION_START_DELAY = 4000; // 4초 후 텍스트 나타나기 시작 (조정 가능)
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*&%$#@!";
const SLOT_INTERVAL_MS = 50;
const REVEAL_INTERVAL_MS = 70;
const CELL_WIDTH = 20 + 2; // width + gap
const NUM_ROWS = 15;

const SlotAnimation = ({ text }) => {
    const [gridChars, setGridChars] = useState([]);
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const numCols = Math.floor(containerWidth / CELL_WIDTH);
        if (numCols === 0) return;

        const totalCells = numCols * NUM_ROWS;
        const textLength = text ? text.length : 0;
        
        let startIndex = -1;
        if (text) {
            const numTextRows = Math.ceil(textLength / numCols);
            const startRow = Math.floor((NUM_ROWS - numTextRows) / 2);
            startIndex = startRow * numCols;
        }

        let initialGrid = Array.from({ length: totalCells }).map((_, i) => {
            const cell = {
                finalChar: ' ',
                currentChar: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)],
                isRevealed: false
            };
            if (text && i >= startIndex && i < startIndex + textLength) {
                cell.finalChar = text[i - startIndex];
                if (cell.finalChar === ' ') {
                    cell.currentChar = ' ';
                }
            }
            return cell;
        });
        
        setGridChars(initialGrid);

        const slotInterval = setInterval(() => {
            setGridChars(currentChars => 
                currentChars.map(c => {
                    if (c.isRevealed || (c.finalChar === ' ' && c.isRevealed)) {
                        return c;
                    }
                    return { ...c, currentChar: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)] };
                })
            );
        }, SLOT_INTERVAL_MS);

        let revealInterval;
        let revealTimeout;

        if (text) {
            const startReveal = () => {
                let revealIndex = 0;
                revealInterval = setInterval(() => {
                    if (revealIndex >= textLength) {
                        clearInterval(revealInterval);
                        clearInterval(slotInterval); 
                        return;
                    }
                    
                    const gridIndex = startIndex + revealIndex;
                    setGridChars(currentChars => {
                        if (!currentChars[gridIndex]) return currentChars;
                        const newChars = [...currentChars];
                        newChars[gridIndex] = { ...newChars[gridIndex], isRevealed: true, currentChar: newChars[gridIndex].finalChar };
                        return newChars;
                    });
                    revealIndex++;
                }, REVEAL_INTERVAL_MS);
            };
            revealTimeout = setTimeout(startReveal, SLOT_ANIMATION_START_DELAY);
        }

        return () => {
            clearInterval(slotInterval);
            if (revealInterval) clearInterval(revealInterval);
            if (revealTimeout) clearTimeout(revealTimeout);
        };
    }, [text]);

    return (
        <GridContainer ref={containerRef}>
            {gridChars.map((char, index) => 
                <CharacterCell key={index} revealed={char.isRevealed}>
                    {char.currentChar}
                </CharacterCell>
            )}
        </GridContainer>
    );
};

// 눈금자를 렌더링하는 컴포넌트
const Rulers = () => {
  const [ticks, setTicks] = useState([]);
  const containerRef = useRef(null);
  const windowSize = useResize(); // 창 크기 가져오기

  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;
      const containerHeight = containerRef.current.offsetHeight;
      if (containerHeight === 0) return;
      const gridIntervalPx = 150;
      const numSegments = 5;
      const smallTickIntervalPx = gridIntervalPx / numSegments;
      const centerPx = containerHeight / 2;
      const zeroLabelBasePx = Math.round(centerPx / gridIntervalPx) * gridIntervalPx;
      const newTicks = [];
      const zeroLabelYPercent = (zeroLabelBasePx / containerHeight) * 100;
      if (zeroLabelYPercent >= 0 && zeroLabelYPercent <= 100) {
        newTicks.push({ yPos: zeroLabelYPercent, label: "0", major: true });
      }
      let currentPxUp = zeroLabelBasePx - smallTickIntervalPx;
      let segmentCountUp = 1;
      let labelValueUp = 1;
      while (currentPxUp >= 0) {
        const yPercent = (currentPxUp / containerHeight) * 100;
        if (yPercent >= 0 && yPercent <= 100) {
          const isMajor = segmentCountUp % numSegments === 0;
          newTicks.push({
            yPos: yPercent,
            label: isMajor ? String(labelValueUp) : null,
            major: isMajor,
          });
          if (isMajor) {
            labelValueUp++;
          }
        }
        currentPxUp -= smallTickIntervalPx;
        segmentCountUp++;
      }
      let currentPxDown = zeroLabelBasePx + smallTickIntervalPx;
      let segmentCountDown = 1;
      let labelValueDown = -1;
      while (currentPxDown <= containerHeight) {
        const yPercent = (currentPxDown / containerHeight) * 100;
        if (yPercent >= 0 && yPercent <= 100) {
          const isMajor = segmentCountDown % numSegments === 0;
          newTicks.push({
            yPos: yPercent,
            label: isMajor ? String(labelValueDown) : null,
            major: isMajor,
          });
          if (isMajor) {
            labelValueDown--;
          }
        }
        currentPxDown += smallTickIntervalPx;
        segmentCountDown++;
      }
      const uniqueTicks = Array.from(new Map(newTicks.map(tick => [tick.yPos.toFixed(3), tick])).values());
      uniqueTicks.sort((a, b) => a.yPos - b.yPos);
      setTicks(uniqueTicks);
    };

    calculateLayout();
  }, [windowSize, containerRef]); // 창 크기나 컨테이너가 변경될 때 다시 계산

  return (
    <div ref={containerRef} style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none'}}>
      <RulerContainer side="left">
        {ticks.map(tick => (
          <React.Fragment key={`left-tick-${tick.yPos.toFixed(3)}-${tick.label || ''}`}>
            <RulerTick side="left" yPos={tick.yPos} major={tick.major} />
            {tick.label && <RulerLabel side="left" yPos={tick.yPos}>{tick.label}</RulerLabel>}
          </React.Fragment>
        ))}
      </RulerContainer>
      <RulerContainer side="right">
        {ticks.map(tick => (
          <React.Fragment key={`right-tick-${tick.yPos.toFixed(3)}-${tick.label || ''}`}>
            <RulerTick side="right" yPos={tick.yPos} major={tick.major} />
            {tick.label && <RulerLabel side="right" yPos={tick.yPos}>{tick.label}</RulerLabel>}
          </React.Fragment>
        ))}
      </RulerContainer>
    </div>
  )
}

const MorePage = () => {
  const router = useRouter();
  const { words } = router.query;
  const [transitionValue, setTransitionValue] = useState(0);

  const { imageName, cardTitle } = useMemo(() => {
    if (!words) {
      return { imageName: 'iphone', cardTitle: '007' }; // 기본값
    }
    const wordList = decodeURIComponent(words).split(',');
    const title = wordList[0] || '007';
    const imgName = wordList[1] || 'iphone';
    return { imageName: imgName, cardTitle: title };
  }, [words]);

  const imagePath = `/${imageName}.png`;

  const fallbackText = useMemo(() => {
    if (!words) {
        return "The relocation of 21st-century artifacts has been completed. These objects are important historical materials that simultaneously show the daily lives, desires, and technological limitations of the people of that time.";
    }
    const wordList = decodeURIComponent(words).split(',');
    const firstWord = wordList[0] || 'This artifact';
    const keywords = wordList.slice(1).join(', ');

    return `Ladies and gentlemen, what you see here, the '${firstWord}', is a symbolic relic from the early 21st century, a turbulent era when humanity began to blur the lines between the digital and the real. People of that time imbued everyday objects like '${keywords}' with special meaning, using them to express their identities. This small artifact encapsulates their hopes, anxieties, and their vision of the future.`;
  }, [words]);

  const [curatorText, setCuratorText] = useState(fallbackText);

  // --- 추가: URL 쿼리를 기반으로 표시할 3D 모델 파일을 결정합니다. ---
  const modelFile = useMemo(() => {
    if (!words) return '/Phone.glb'; // 쿼리가 없으면 기본 모델을 반환합니다.

    const wordList = decodeURIComponent(words).split(',');
    const imageName = wordList[1]; // 'iphone', 'keyboard', 'pigeon' 등의 이미지 이름

    switch (imageName) {
      case 'keyboard':
        return '/Keyboard.glb';
      case 'pigeon':
        return '/pigeon.glb';
      case 'umbrella':
        return '/Umbrella.glb';
      case 'iphone':
      default:
        return '/Phone.glb';
    }
  }, [words]);

  useEffect(() => {
    if (router.isReady && words) {
        let wordList = decodeURIComponent(words).split(',');

        fetch('/api/gpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: wordList }),
        })
        .then(res => {
          if (res.ok) return res.json();
          // 실패 시에는 아무것도 하지 않아 fallbackText가 유지됨
          return Promise.reject('API Error');
        })
        .then(data => {
            if (data && data.text) {
              setCuratorText(data.text);
            }
        })
        .catch(err => {
            // 콘솔에 에러를 기록하지만, UI는 fallbackText를 계속 보여줌
            console.error("Failed to fetch from GPT API, showing fallback.", err);
        });
    } else if (!words) {
      // words가 없을 경우, curatorText를 fallbackText로 설정
      setCuratorText(fallbackText);
    }
  }, [router.isReady, words, fallbackText]);
  
  return (
    <PageContainer>
      <ErikaMonoFont />
      <Rulers />
      
      <FlexContainer>
        <LeftColumn>
          {/* 결정된 모델 파일을 prop으로 전달합니다. */}
          <ParticleAnimation modelFile={modelFile} transitionValue={transitionValue} />
          <SliderInput
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={transitionValue}
            onChange={(e) => setTransitionValue(parseFloat(e.target.value))}
          />
        </LeftColumn>
        <RightColumn>
          <ContentWrapper>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 400,
              color: '#A8A8A8',
              marginTop: 0,
              marginBottom: '1rem',
              textAlign: 'left',
              fontFamily: "'G2ErikaMono-Medium', monospace"
            }}>
              this artifacts...
            </h2>
            <ArtifactImage src={imagePath} alt={cardTitle} />
            <Title>Curator's Note</Title>
            <SlotAnimation text={curatorText} />
          </ContentWrapper>
          <BackButton onClick={() => router.push('/')}>
            Back to Main
          </BackButton>
        </RightColumn>
      </FlexContainer>
    </PageContainer>
  );
};

export default MorePage; 