import React, { useEffect, useState, useMemo } from 'react';
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
`;

const WordSpan = styled.span`
  opacity: 0;
  animation: ${fadeIn} 0.5s ease forwards;
  animation-delay: ${props => props.delay}s;
  display: inline-block; // Ensures transform works correctly
  margin-right: 0.5em; // Add space between words
`;

const MorePage = () => {
  const router = useRouter();
    const [animatedText, setAnimatedText] = useState('');
    const { words } = router.query;

    const curatorText = useMemo(() => {
        if (!words) {
            return "21세기 유물들의 재배치가 완료되었습니다. 이 오브제들은 당시 사람들의 일상과 욕망, 그리고 기술적 한계를 동시에 보여주는 중요한 사료입니다.";
        }
        
        const wordList = decodeURIComponent(words).split(',');
        const firstWord = wordList[0] || '이 유물';
        const keywords = wordList.slice(1).join(', ');

        return `여러분, 보시는 이 '${firstWord}'은(는) 21세기 초, 인류가 디지털과 현실의 경계를 허물기 시작했던 격동기의 상징물입니다. 당시 사람들은 '${keywords}' 같은 일상적 사물에 특별한 의미를 부여하며, 자신들의 정체성을 표현하려 했습니다. 이 작은 유물 하나에 그들의 희망과 불안, 그리고 미래에 대한 상상이 모두 담겨 있는 셈이죠.`;

    }, [words]);
  
    const textElements = useMemo(() => {
        return curatorText.split(' ').map((word, index) => (
            <WordSpan key={index} delay={index * 0.1}>
                {word}
            </WordSpan>
        ));
    }, [curatorText]);

    return (
    <>
      <ErikaMonoFont />
      <Container>
        <AnimationWrapper>
          {textElements}
        </AnimationWrapper>
      </Container>
    </>
  );
};

export default MorePage; 