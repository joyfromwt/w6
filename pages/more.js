import React, { useEffect, useState, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { ErikaMonoFont } from '../components/main/styles';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
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
  font-family: 'G2ErikaMono-Medium', monospace;
`;

const AnimationWrapper = styled.div`
  max-width: 800px;
  width: 100%;
  text-align: left;
  line-height: 1.8;
  font-size: 1.2rem;
  animation: ${fadeIn} 1.5s ease-out forwards;
  display: flex;
  justify-content: center;
`;

const GridContainer = styled.div`
    width: 100%;
    display: grid;
    gap: 2px;
    padding: 20px;
    border: 1px solid #333;
    background-color: #000;
    grid-template-columns: repeat(auto-fill, 20px);
    grid-auto-rows: 30px;
    justify-content: center;
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
  font-size: 20px;
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
                    if (c.isRevealed || (c.finalChar === ' ' && c.isRevealed)) { // Revealed spaces should stop spinning
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
                        clearInterval(slotInterval); // Stop all animations when done
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

    console.log('[SlotAnimation] Received text prop:', text);

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

const MorePage = () => {
  const router = useRouter();
    const { words } = router.query;
    const [curatorText, setCuratorText] = useState(null);

    const fallbackText = useMemo(() => {
        if (!words) {
            return "21세기 유물들의 재배치가 완료되었습니다. 이 오브제들은 당시 사람들의 일상과 욕망, 그리고 기술적 한계를 동시에 보여주는 중요한 사료입니다.";
        }
        const wordList = decodeURIComponent(words).split(',');
        const firstWord = wordList[0] || '이 유물';
        const keywords = wordList.slice(1).join(', ');

        return `여러분, 보시는 이 '${firstWord}'은(는) 21세기 초, 인류가 디지털과 현실의 경계를 허물기 시작했던 격동기의 상징물입니다. 당시 사람들은 '${keywords}' 같은 일상적 사물에 특별한 의미를 부여하며, 자신들의 정체성을 표현하려 했습니다. 이 작은 유물 하나에 그들의 희망과 불안, 그리고 미래에 대한 상상이 모두 담겨 있는 셈이죠.`;
    }, [words]);
  
    useEffect(() => {
        if (router.isReady) {
            console.log('[MorePage] Router is ready. Query words:', words);
            let wordList = words ? decodeURIComponent(words).split(',') : [];

            // words 파라미터가 없을 경우, 기본값 설정
            if (wordList.length === 0) {
                console.log('[MorePage] No words in query, using default words for API call.');
                wordList = ['스마트폰', '일상', '디지털'];
            }

            console.log('[MorePage] Fetching text from /api/gpt with words:', wordList);
            fetch('/api/gpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: wordList }),
            })
            .then(res => {
                if (!res.ok) {
                    console.error('[MorePage] API response not OK:', res.status);
                    throw new Error('API Error');
                }
                return res.json();
            })
            .then(data => {
                console.log('[MorePage] Successfully fetched data:', data);
                setCuratorText(data.text);
            })
            .catch(error => {
                console.error("[MorePage] Failed to fetch from GPT, using fallback.", error);
                setCuratorText(fallbackText);
            });
        }
    }, [router.isReady, words, fallbackText]);
  
    console.log('[MorePage] Current curatorText state:', curatorText);

    return (
    <>
      <ErikaMonoFont />
      <Container>
        <AnimationWrapper>
          <SlotAnimation text={curatorText} />
        </AnimationWrapper>
      </Container>
    </>
  );
};

export default MorePage; 