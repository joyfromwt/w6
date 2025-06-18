import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const blink = keyframes`
  50% { opacity: 0; }
`;

const Cursor = styled.span`
  display: inline-block;
  width: 10px;
  height: 1.2rem;
  background-color: #fff;
  margin-left: 5px;
  animation: ${blink} 1s step-end infinite;
`;

const Typewriter = ({
  text,
  typingSpeed = 50,
  sentencePause = 700,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;

    const type = () => {
      if (i < text.length) {
        const char = text.charAt(i);
        setDisplayedText(prev => prev + char);
        i++;
        
        const isEndOfSentence = char === '.' || char === '?' || char === '!';
        const timeout = isEndOfSentence ? sentencePause : typingSpeed;

        setTimeout(type, timeout);
      } else {
        setIsTyping(false);
      }
    };

    const startTimeout = setTimeout(type, 500); // Initial delay before starting

    return () => {
      clearTimeout(startTimeout);
      // No need to clear the inner timeout as it chains itself and stops at the end
    };
  }, [text, typingSpeed, sentencePause]);

  return (
    <span>
      {displayedText}
      {isTyping && <Cursor />}
    </span>
  );
};

export default Typewriter; 