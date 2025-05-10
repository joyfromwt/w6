import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Space_Mono } from "next/font/google";
import Link from 'next/link';
import Image from 'next/image';
import {
  Container,
  Header,
  Title,
  Subtitle,
  Section,
  ProjectCard,
  MagnifyingGlassContainer,
  TextCursor,
  MagnifyingGlassLabel,
  RulerContainer,
  RulerTick,
  RulerLabel,
  SocialLinks,
  Link as StyledLink
} from './styles';
import MagnifyingGlassContent from './MagnifyingGlassContent';
import { useRouter } from 'next/router';
import ProjectPopup from './ProjectPopup';
import TextArt from './TextArt';

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const CARD_WIDTH_PX = 200;
const CARD_HEIGHT_PX = 200;
const MAGNIFYING_GLASS_SIZE_PX = 170;
const LABEL_OFFSET_PX = 2;

const MainComponent = () => {
  const containerRef = useRef(null);
  const [rulerTicks, setRulerTicks] = useState([]);

  const cardsRef = useRef([]);
  const [cards, setCards] = useState([]);
  const [renderTick, setRenderTick] = useState(0);
  const [draggingCard, setDraggingCard] = useState(null);
  const sectionRef = useRef(null);
  const [customCursorPosition, setCustomCursorPosition] = useState({ x: 0, y: 0 });
  const [showCustomCursor, setShowCustomCursor] = useState(false);
  const [isTextCursorVisible, setIsTextCursorVisible] = useState(false);
  const [hoveredCardDetails, setHoveredCardDetails] = useState(null);
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState(null);
  const [mouseDownPos, setMouseDownPos] = useState(null);

  const cursorPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const currentContainerRef = containerRef.current;
    if (!currentContainerRef) return;

    const calculateRulerLayout = () => {
      const containerHeight = currentContainerRef.offsetHeight;
      if (containerHeight === 0) return;

      const gridIntervalPx = 150;
      const numSegments = 5; // Major tick interval will be divided into 5 segments
      const smallTickIntervalPx = gridIntervalPx / numSegments;

      const centerPx = containerHeight / 2;
      // Ensure zeroLabelPx is a multiple of smallTickIntervalPx for alignment
      // And also a conceptual multiple of gridIntervalPx for label placement
      const zeroLabelBasePx = Math.round(centerPx / gridIntervalPx) * gridIntervalPx;


      const newTicks = [];

      // Add "0" tick - this is always a major tick if visible
      const zeroLabelYPercent = (zeroLabelBasePx / containerHeight) * 100;
      if (zeroLabelYPercent >= 0 && zeroLabelYPercent <= 100) {
        newTicks.push({ yPos: zeroLabelYPercent, label: "0", major: true });
      }

      // Generate ticks upwards from "0"
      let currentPxUp = zeroLabelBasePx - smallTickIntervalPx;
      let segmentCountUp = 1;
      let labelValueUp = 1;
      while (currentPxUp >= 0) {
        const yPercent = (currentPxUp / containerHeight) * 100;
        if (yPercent >= 0 && yPercent <= 100) { // Ensure tick is within bounds
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

      // Generate ticks downwards from "0"
      let currentPxDown = zeroLabelBasePx + smallTickIntervalPx;
      let segmentCountDown = 1;
      let labelValueDown = -1;
      while (currentPxDown <= containerHeight) {
        const yPercent = (currentPxDown / containerHeight) * 100;
         if (yPercent >= 0 && yPercent <= 100) { // Ensure tick is within bounds
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
      
      // Remove duplicate ticks (e.g. if zeroLabelBasePx was exactly 0 or containerHeight)
      // And sort
      const uniqueTicks = Array.from(new Map(newTicks.map(tick => [tick.yPos.toFixed(3), tick])).values());
      uniqueTicks.sort((a, b) => a.yPos - b.yPos);
      setRulerTicks(uniqueTicks);
    };

    calculateRulerLayout();
    const debouncedCalculateLayout = () => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(calculateRulerLayout, 100);
      };
    };
    const handleResize = debouncedCalculateLayout();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (sectionRef.current && cards.length === 0) {
      const initialCards = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `(${(i + 1).toString().padStart(3, '0')})`,
        image: i < 3 ? ['/cig.png', '/airpod.png', '/starbucks.png'][i] : undefined,
        position: { 
          x: Math.random() * (100 - (CARD_WIDTH_PX / sectionRef.current.offsetWidth * 100)), 
          y: Math.random() * (100 - (CARD_HEIGHT_PX / sectionRef.current.offsetHeight * 100))
        },
        velocity: getRandomVelocity(),
        width: CARD_WIDTH_PX,
        height: CARD_HEIGHT_PX,
      }));
      setCards(initialCards);
      cardsRef.current = initialCards;
    }
  }, [cards.length]);

  const handleMouseDown = useCallback((e, index) => {
    if (!sectionRef.current) return;
    const cardElement = e.currentTarget;
    const cardRect = cardElement.getBoundingClientRect();
    const offsetX = e.clientX - cardRect.left;
    const offsetY = e.clientY - cardRect.top;
    setDraggingCard({ index, offset: { x: offsetX, y: offsetY } });
    setCards(prevCards => prevCards.map((card, i) => i === index ? { ...card, velocity: { x: 0, y: 0 } } : card));
    e.preventDefault(); 
  }, []);

  const handleGlobalMouseMove = useCallback((e) => {
    const cursorX = e.clientX;
    const cursorY = e.clientY;
    cursorPosRef.current = { x: cursorX, y: cursorY };
    setCustomCursorPosition({ x: cursorX, y: cursorY });

    let newHoveredCardDetails = null;
    if (sectionRef.current) {
      const sectionRect = sectionRef.current.getBoundingClientRect();
      
      for (let i = 0; i < cardsRef.current.length; i++) {
        if (draggingCard && draggingCard.index === i) continue;

        const card = cardsRef.current[i];
        const cardLeftPx = (card.position.x / 100) * sectionRect.width + sectionRect.left;
        const cardTopPx = (card.position.y / 100) * sectionRect.height + sectionRect.top;
        
        const cardBox = {
          left: cardLeftPx,
          right: cardLeftPx + card.width,
          top: cardTopPx,
          bottom: cardTopPx + card.height + 200,
        };

        if (cursorX >= cardBox.left && cursorX <= cardBox.right &&
            cursorY >= cardBox.top && cursorY <= cardBox.bottom) {
          
          const relativeX = cursorX - cardBox.left;
          const relativeY = cursorY - cardBox.top;
          
          newHoveredCardDetails = {
            project: card, 
            relativeX,
            relativeY,
            cardWidth: card.width,
            cardHeight: card.height,
          };
          break; 
        }
      }
    }
    setHoveredCardDetails(newHoveredCardDetails);

    if (newHoveredCardDetails) {
      setShowCustomCursor(true);
    } else {
      setShowCustomCursor(false);
    }

    if (draggingCard && sectionRef.current) {
        const sectionRect = sectionRef.current.getBoundingClientRect();
        let newX = cursorX - sectionRect.left - draggingCard.offset.x;
        let newY = cursorY - sectionRect.top - draggingCard.offset.y;
        let xPercent = (newX / sectionRect.width) * 100;
        let yPercent = (newY / sectionRect.height) * 100;
        const maxXPercent = 100 - (cardsRef.current[draggingCard.index].width / sectionRect.width * 100);
        const maxYPercent = 100 - (cardsRef.current[draggingCard.index].height / sectionRect.height * 100);
        xPercent = Math.max(0, Math.min(xPercent, maxXPercent));
        yPercent = Math.max(0, Math.min(yPercent, maxYPercent));
        cardsRef.current = cardsRef.current.map((card, i) => 
          i === draggingCard.index ? { ...card, position: { x: xPercent, y: yPercent } } : card
        );
        setCards([...cardsRef.current]);
    }
  }, [draggingCard]);

  const handleMouseUp = useCallback(() => {
    if (draggingCard) {
      setCards(prevCards => prevCards.map((card, i) => 
        i === draggingCard.index ? { ...card, velocity: getRandomVelocity() } : card
      ));
      setDraggingCard(null);
    }
  }, [draggingCard]);

  useEffect(() => {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    if (draggingCard) {
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingCard, handleGlobalMouseMove, handleMouseUp]);
  
  useEffect(() => {
    if (cards.length === 0) return;
    let animationFrameId;
    let lastTime = performance.now();
    let lastRender = performance.now();
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      cardsRef.current = cardsRef.current.map((card, index) => {
        if (draggingCard && draggingCard.index === index) return card;
        const speed = 0.01;
        let newX = card.position.x + card.velocity.x * speed * deltaTime;
        let newY = card.position.y + card.velocity.y * speed * deltaTime;
        let newVelocityX = card.velocity.x;
        let newVelocityY = card.velocity.y;
        if (sectionRef.current) {
          const parentWidth = sectionRef.current.offsetWidth;
          const parentHeight = sectionRef.current.offsetHeight;
          const maxX = (parentWidth - card.width) / parentWidth * 100;
          const maxY = (parentHeight - card.height) / parentHeight * 100;
          if (newX <= 0 || newX >= maxX) { newVelocityX = -newVelocityX; newX = newX <= 0 ? 0 : maxX; }
          if (newY <= 0 || newY >= maxY) { newVelocityY = -newVelocityY; newY = newY <= 0 ? 0 : maxY; }
        }
        return { ...card, position: { x: newX, y: newY }, velocity: { x: newVelocityX, y: newVelocityY } };
      });
      if (currentTime - lastRender > 100) {
        setCards([...cardsRef.current]);
        setRenderTick(tick => tick + 1);
        lastRender = currentTime;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [cards.length, draggingCard]);

  const handleSectionMouseEnter = () => {
    setIsTextCursorVisible(true);
  };
  const handleSectionMouseLeave = () => {
    setShowCustomCursor(false);
    setHoveredCardDetails(null);
    setIsTextCursorVisible(false);
  };

  const handleCardMouseDown = (e, index) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    handleMouseDown(e, index);
  };

  const handleCardMouseUp = (e, project) => {
    if (!mouseDownPos) return;
    const dx = Math.abs(e.clientX - mouseDownPos.x);
    const dy = Math.abs(e.clientY - mouseDownPos.y);
    const CLICK_THRESHOLD = 5; // px
    if (dx < CLICK_THRESHOLD && dy < CLICK_THRESHOLD) {
      setSelectedProject(project);
    }
    setMouseDownPos(null);
  };

  return (
    <Container className={spaceMono.className} ref={containerRef}>
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

      {isTextCursorVisible && !showCustomCursor && (
        <TextCursor 
          fontFamily={spaceMono.style.fontFamily}
          style={{
            left: `${customCursorPosition.x}px`,
            top: `${customCursorPosition.y}px`,
          }}
        >
          look at that
        </TextCursor>
      )}
      {showCustomCursor && (
        <>
          <MagnifyingGlassLabel
            fontFamily={spaceMono.style.fontFamily}
            style={{
              left: `${customCursorPosition.x}px`,
              top: `${customCursorPosition.y - (MAGNIFYING_GLASS_SIZE_PX / 2) - LABEL_OFFSET_PX}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            it seems like...
          </MagnifyingGlassLabel>
          <MagnifyingGlassContainer 
            style={{
              left: `${customCursorPosition.x}px`,
              top: `${customCursorPosition.y}px`,
            }}
          >
            <MagnifyingGlassContent hoveredCardDetails={hoveredCardDetails} />
          </MagnifyingGlassContainer>
        </>
      )}
      <Header>
        <Title>Artifacts of Tomorrow</Title>
        <Subtitle>Welcome. This is a unique space where we view our present day through the perspective of the future. How might curators from 2190 interpret our ordinary objects like smartphones, headphones, and books?
        Move the time slider to change the year, select an exhibit, and present a curator card to experience how today's objects transform and are reinterpreted from various perspectives.</Subtitle>
      </Header>

      <Section 
        ref={sectionRef}
        onMouseEnter={handleSectionMouseEnter}
        onMouseLeave={handleSectionMouseLeave}
      >
        {cardsRef.current.map((project, index) => (
            <ProjectCard 
              key={project.id}
              onMouseDown={(e) => handleCardMouseDown(e, index)}
              onMouseUp={(e) => handleCardMouseUp(e, project)}
              style={{
                left: `${project.position.x}%`,
                top: `${project.position.y}%`,
                transform: draggingCard && draggingCard.index === index ? 'scale(1.1)' : 'scale(1.0)',
                zIndex: draggingCard && draggingCard.index === index ? 1000 : 'auto',
                userSelect: 'none',
                pointerEvents: 'auto',
              }}
            >
              <h3>{project.title}</h3>
              {project.image && (
                <TextArt src={project.image} fontSize="0.6rem" hoverEffect={false} />
              )}
            </ProjectCard>
        ))}
      </Section>

      <ProjectPopup
        open={!!selectedProject}
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onMore={() => {
          if (selectedProject) {
            router.push(`/project/${selectedProject.id}`);
            setSelectedProject(null);
          }
        }}
      />

      <SocialLinks>
        <StyledLink href="https://github.com" target="_blank" rel="noopener noreferrer">
          GitHub
        </StyledLink>
        <StyledLink href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </StyledLink>
      </SocialLinks>
    </Container>
  );
};

export default MainComponent;

const getRandomAngle = () => {
  return Math.random() * Math.PI * 2;
};

const getRandomVelocity = () => {
  const angle = getRandomAngle();
  const speed = 0.1 + Math.random() * 0.1;
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  };
}; 