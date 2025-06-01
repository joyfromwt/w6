import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';

const TARGET_SENTENCE = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*&%$#@!";
const CELL_FONT_SIZE_PX = 24; // 고정 픽셀 폰트 크기
const REVEAL_INTERVAL_MS = 60;
const SLOT_ANIMATION_INTERVAL_MS = 40;
const BORDER_COLOR = 'rgba(255, 255, 255, 0.3)';
const THIN_BORDER_WIDTH = '0.5px';
const THICK_BORDER_WIDTH = '1.5px';

const PageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #000;
  font-family: 'G2ErikaMono-Medium', monospace;
  overflow: hidden;
  padding: 20px; // 전체 페이지 패딩
  box-sizing: border-box;
  // Main 페이지 격자 배경 스타일 추가
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
  background-size: 150px 150px;
  position: relative; // background-image가 다른 요소에 가려지지 않도록
`;

const AnimationWrapper = styled.div`
  width: 100%;
  max-width: 898px;
  height: 600px;
  background-color: #000; // 내부 배경색 (페이지와 동일하게)
  padding: 0px; // 그리드 컨테이너와의 내부 패딩
  box-sizing: border-box;
  display: flex; // 내부 GridContainer를 채우기 위함
  margin-top: 80px; // 텍스트 박스 위치 조정을 위해 상단 여백 추가
  margin-left: -10px;
  border: 0px; 
  z-index: 1; // PageContainer의 배경보다 위에 오도록
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.cols}, 1fr);
  grid-template-rows: repeat(${props => props.rows}, 1fr);
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-left: ${THIN_BORDER_WIDTH} solid ${BORDER_COLOR};
  border-top: ${THIN_BORDER_WIDTH} solid ${BORDER_COLOR};
`;

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${CELL_FONT_SIZE_PX}px;
  line-height: 1;
  color: ${props => (props.isRevealed ? '#FFF' : '#A8A8A8')};
  transition: color 0.3s ease-in-out;
  white-space: pre;
  user-select: none;
  overflow: hidden; // 글자가 셀을 넘치지 않도록
  box-sizing: border-box;
  border-right: ${THIN_BORDER_WIDTH} solid ${BORDER_COLOR};
  border-bottom: ${(props) => (props.rowIndex + 1) % 4 === 0 ? THICK_BORDER_WIDTH : THIN_BORDER_WIDTH} solid ${BORDER_COLOR};
`;

// Ruler styles from main page
export const RulerContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35px;
  pointer-events: none;
  font-family: inherit; // Use G2ErikaMono-Medium from PageContainer
  z-index: 2; // AnimationWrapper 보다 위에 오도록

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
  font-size: 0.6rem; // main 페이지와 동일하게
  top: ${({ yPos }) => yPos}%;
  transform: translateY(-50%);

  ${({ side }) => side === 'left' ? 
    `right: 20px;`
    :
    `left: 20px;`
  }
`;

const BackButton = styled.button`
  position: fixed;
  top: 20px; // bottom에서 top으로 변경
  left: 150px; // 좌측 하단으로 위치 변경
  padding: 10px 20px;
  background-color: #A8A8A8;
  color: #000;
  border: none;
  border-radius: 0; // NextButton과 동일하게 radius 0
  cursor: pointer;
  font-family: 'G2ErikaMono-Medium', monospace;
  font-size: 1rem;
  z-index: 1000; 
  &:hover {
    background-color: #fff;
  }
`;

const getRandomChar = () => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

const MorePage = () => {
  const router = useRouter();
  const [grid, setGrid] = useState([]);
  const [dimensions, setDimensions] = useState({ rows: 0, cols: 0 });
  const revealedCountRef = useRef(0);
  const animationFrameRef = useRef();
  const lastSlotUpdateTimeRef = useRef(0);
  const animationWrapperRef = useRef(null); 
  const pageContainerRef = useRef(null); // For Ruler calculation
  const [rulerTicks, setRulerTicks] = useState([]); // For Ruler

  // Ruler calculation logic from main page
  useEffect(() => {
    const currentContainerRef = pageContainerRef.current;
    if (!currentContainerRef) return;

    const calculateRulerLayout = () => {
      const containerHeight = currentContainerRef.offsetHeight;
      if (containerHeight === 0) return;
      const gridIntervalPx = 150; // Same as main page
      const numSegments = 5; // Same as main page
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
          if (isMajor) labelValueUp++;
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
          if (isMajor) labelValueDown--;
        }
        currentPxDown += smallTickIntervalPx;
        segmentCountDown++;
      }
      const uniqueTicks = Array.from(new Map(newTicks.map(tick => [tick.yPos.toFixed(3), tick])).values());
      uniqueTicks.sort((a, b) => a.yPos - b.yPos);
      setRulerTicks(uniqueTicks);
    };

    calculateRulerLayout();
    const resizeObserver = new ResizeObserver(calculateRulerLayout);
    resizeObserver.observe(currentContainerRef);

    return () => {
      resizeObserver.unobserve(currentContainerRef);
    };
  }, []); // Runs once on mount and when containerRef changes (which it shouldn't after mount)

  useEffect(() => {
    const calculateDimensions = () => {
      if (animationWrapperRef.current) {
        const testChar = document.createElement('span');
        testChar.style.fontSize = `${CELL_FONT_SIZE_PX}px`;
        testChar.style.fontFamily = "'G2ErikaMono-Medium', monospace";
        testChar.style.visibility = 'hidden';
        testChar.style.position = 'absolute';
        testChar.style.whiteSpace = 'pre'; 
        testChar.innerText = 'W';
        document.body.appendChild(testChar);
        const charWidth = testChar.offsetWidth;
        const charHeight = testChar.offsetHeight;
        document.body.removeChild(testChar);

        const style = getComputedStyle(animationWrapperRef.current);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingBottom = parseFloat(style.paddingBottom) || 0;

        const containerWidth = animationWrapperRef.current.offsetWidth - paddingLeft - paddingRight;
        const containerHeight = animationWrapperRef.current.offsetHeight - paddingTop - paddingBottom;
        
        const numericThinBorderWidth = parseFloat(THIN_BORDER_WIDTH) || 0; // THIN_BORDER_WIDTH를 숫자로 변환, 실패 시 0
        const cols = charWidth > 0 ? Math.floor(containerWidth / (charWidth + numericThinBorderWidth)) : 1;
        const rows = charHeight > 0 ? Math.floor(containerHeight / (charHeight + numericThinBorderWidth)) : 1;
        
        setDimensions({ rows: Math.max(1, rows), cols: Math.max(1, cols) });
      }
    };

    calculateDimensions();
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (animationWrapperRef.current) {
      resizeObserver.observe(animationWrapperRef.current);
    }

    return () => {
      if (animationWrapperRef.current) {
        resizeObserver.unobserve(animationWrapperRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (dimensions.rows === 0 || dimensions.cols === 0) return;

    revealedCountRef.current = 0;
    const initialGrid = Array(dimensions.rows)
      .fill(null)
      .map((_, rowIndex) =>
        Array(dimensions.cols)
          .fill(null)
          .map((__, colIndex) => {
            const flatIndex = rowIndex * dimensions.cols + colIndex;
            return {
              id: `cell-${rowIndex}-${colIndex}`,
              rowIndex: rowIndex,
              targetChar: flatIndex < TARGET_SENTENCE.length ? TARGET_SENTENCE[flatIndex] : ' ',
              displayChar: getRandomChar(),
              isRevealed: false,
            };
          })
      );
    setGrid(initialGrid);
  }, [dimensions]);

  useEffect(() => {
    if (dimensions.rows === 0 || dimensions.cols === 0 || grid.length === 0) return;
  
    const totalCells = dimensions.rows * dimensions.cols;
    let revealIntervalId;

    const startRevealInterval = () => {
        clearInterval(revealIntervalId);
        revealIntervalId = setInterval(() => {
            if (revealedCountRef.current < totalCells) {
                setGrid(prevGrid => {
                    const newGrid = JSON.parse(JSON.stringify(prevGrid)); 
                    const rowIndex = Math.floor(revealedCountRef.current / dimensions.cols);
                    const colIndex = revealedCountRef.current % dimensions.cols;
                    
                    if (newGrid[rowIndex] && newGrid[rowIndex][colIndex]) {
                        newGrid[rowIndex][colIndex].isRevealed = true;
                        newGrid[rowIndex][colIndex].displayChar = newGrid[rowIndex][colIndex].targetChar;
                    } 
                    return newGrid;
                });
                revealedCountRef.current += 1;
            } else {
                clearInterval(revealIntervalId);
            }
        }, REVEAL_INTERVAL_MS);
    };

    startRevealInterval();
  
    return () => clearInterval(revealIntervalId);
  }, [grid, dimensions]); 

  useEffect(() => {
    if (dimensions.rows === 0 || dimensions.cols === 0 || grid.length === 0) return;

    const animateSlots = (timestamp) => {
      if (revealedCountRef.current >= dimensions.rows * dimensions.cols) {
        cancelAnimationFrame(animationFrameRef.current);
        return; 
      }
      if (timestamp - lastSlotUpdateTimeRef.current > SLOT_ANIMATION_INTERVAL_MS) {
        lastSlotUpdateTimeRef.current = timestamp;
        setGrid(prevGrid => {
          return prevGrid.map(row =>
            row.map(cell =>
              cell.isRevealed ? cell : { ...cell, displayChar: getRandomChar() }
            )
          );
        });
      }
      animationFrameRef.current = requestAnimationFrame(animateSlots);
    };

    animationFrameRef.current = requestAnimationFrame(animateSlots);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [grid, dimensions]); 

  const handleBackButtonClick = () => {
    router.back();
  };

  if (dimensions.rows === 0 || dimensions.cols === 0 && rulerTicks.length === 0) {
    // Also check rulerTicks length for initial loading state if needed
    return (
      <PageContainer ref={pageContainerRef}>
        <AnimationWrapper ref={animationWrapperRef}>
          <p style={{color: 'white', margin: 'auto'}}>Loading dimensions...</p>
        </AnimationWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer ref={pageContainerRef}>
      <RulerContainer side="left">
        {rulerTicks.map(tick => (
          <React.Fragment key={`left-tick-${tick.yPos.toFixed(3)}-${tick.label || ''}`}>
            <RulerTick side="left" yPos={tick.yPos} major={tick.major} />
            {tick.label && <RulerLabel side="left" yPos={tick.yPos}>{tick.label}</RulerLabel>}
          </React.Fragment>
        ))}
      </RulerContainer>
      <RulerContainer side="right">
        {rulerTicks.map(tick => (
          <React.Fragment key={`right-tick-${tick.yPos.toFixed(3)}-${tick.label || ''}`}>
            <RulerTick side="right" yPos={tick.yPos} major={tick.major} />
            {tick.label && <RulerLabel side="right" yPos={tick.yPos}>{tick.label}</RulerLabel>}
          </React.Fragment>
        ))}
      </RulerContainer>

      <AnimationWrapper ref={animationWrapperRef}>
        <GridContainer rows={dimensions.rows} cols={dimensions.cols}>
          {grid.flat().map(cell => (
            <Cell 
              key={cell.id} 
              isRevealed={cell.isRevealed}
              rowIndex={cell.rowIndex}
            >
              {cell.displayChar}
            </Cell>
          ))}
        </GridContainer>
      </AnimationWrapper>

      <BackButton onClick={handleBackButtonClick}>
        back
      </BackButton>
    </PageContainer>
  );
};

export default MorePage; 