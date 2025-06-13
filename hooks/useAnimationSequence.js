import { useState, useCallback, useEffect } from 'react';
import { ANIMATION_PHASES, ANIMATION_DELAYS } from '../constants/animation';

const useAnimationSequence = () => {
  const [phase, setPhase] = useState(ANIMATION_PHASES.INITIAL);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [isCardsVisible, setIsCardsVisible] = useState(false);

  // 다음 단계로 진행하는 함수
  const startNextPhase = useCallback(() => {
    switch (phase) {
      case ANIMATION_PHASES.INITIAL:
        setPhase(ANIMATION_PHASES.GRID);
        setIsGridVisible(true);
        break;
      case ANIMATION_PHASES.GRID:
        setPhase(ANIMATION_PHASES.HEADER);
        setIsHeaderVisible(true);
        break;
      case ANIMATION_PHASES.HEADER:
        setPhase(ANIMATION_PHASES.CARDS);
        setIsCardsVisible(true);
        break;
      case ANIMATION_PHASES.CARDS:
        setPhase(ANIMATION_PHASES.COMPLETE);
        break;
      default:
        break;
    }
  }, [phase]);

  // 초기 애니메이션 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      startNextPhase();
    }, ANIMATION_DELAYS.GRID_FADE_IN);

    return () => clearTimeout(timer);
  }, []);

  return {
    phase,
    isGridVisible,
    isHeaderVisible,
    isCardsVisible,
    startNextPhase
  };
};

export default useAnimationSequence; 