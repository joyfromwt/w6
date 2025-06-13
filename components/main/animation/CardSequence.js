import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ANIMATION_DELAYS, ANIMATION_DURATIONS } from '../../../constants/animation';

const CardContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const AnimatedCard = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  background: transparent;
  border-radius: 10px;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  transition: all ${ANIMATION_DURATIONS.CARD_FADE}ms cubic-bezier(0.4,0,0.2,1);
  
  &.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const CardSequence = ({ isVisible, cards, onComplete }) => {
  const [visibleCards, setVisibleCards] = useState([]);

  useEffect(() => {
    if (isVisible && cards.length > 0) {
      let currentIndex = 0;
      
      const showNextCard = () => {
        if (currentIndex < cards.length) {
          setVisibleCards(prev => [...prev, cards[currentIndex]]);
          currentIndex++;
          
          if (currentIndex < cards.length) {
            setTimeout(showNextCard, ANIMATION_DELAYS.CARD_INTERVAL);
          } else {
            setTimeout(onComplete, ANIMATION_DURATIONS.CARD_FADE);
          }
        }
      };

      setTimeout(showNextCard, ANIMATION_DELAYS.CARD_START);
    }
  }, [isVisible, cards, onComplete]);

  return (
    <CardContainer>
      {cards.map((card, index) => (
        <AnimatedCard
          key={card.id}
          className={visibleCards.includes(card) ? 'visible' : ''}
          style={{
            left: card.position.x,
            top: card.position.y
          }}
        >
          <img src={card.image} alt={card.title} />
        </AnimatedCard>
      ))}
    </CardContainer>
  );
};

export default React.memo(CardSequence); 