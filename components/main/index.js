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
  TextCursor,
  RulerContainer,
  RulerTick,
  RulerLabel,
  WebcamContainer,
  WebcamLabel,
  NextButton
} from './styles';
import { useRouter } from 'next/router';
import ProjectPopup from './ProjectPopup';
import TextArt from './TextArt';
import * as tf from '@tensorflow/tfjs-core';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const CARD_WIDTH_PX = 200;
const CARD_HEIGHT_PX = 200;
const FIST_RESET_COOLDOWN_MS = 3000;

const MainComponent = () => {
  const containerRef = useRef(null);
  const [rulerTicks, setRulerTicks] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cocoSsdModelRef = useRef(null);
  const requestRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  const cardsRef = useRef([]);
  const [cards, setCards] = useState([]);
  const [draggingCard, setDraggingCard] = useState(null);
  const sectionRef = useRef(null);
  const [customCursorPosition, setCustomCursorPosition] = useState({ x: 0, y: 0 });
  const [isTextCursorVisible, setIsTextCursorVisible] = useState(false);
  const hoveredCardIdRef = useRef(null);

  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState(null);
  const [mouseDownPos, setMouseDownPos] = useState(null);

  const cursorPosRef = useRef({ x: 0, y: 0 });
  const [detectedObjectName, setDetectedObjectName] = useState('');
  const [isCellphoneDetected, setIsCellphoneDetected] = useState(false);
  const [isKeyboardDetected, setIsKeyboardDetected] = useState(false);
  const [isCupDetected, setIsCupDetected] = useState(false);

  const [detectionStates, setDetectionStates] = useState({
    'cell phone': { startTime: null, popupShown: false, imagePath: '/iphone.png' },
    'keyboard': { startTime: null, popupShown: false, imagePath: '/keyboard.png' },
    'cup': { startTime: null, popupShown: false, imagePath: '/starbucks.png' },
  });
  const [labelObjectStartTime, setLabelObjectStartTime] = useState(null);
  const currentlyTimedObjectRef = useRef('');
  const lastFistTimeRef = useRef(0);

  const [droppedCardIds, setDroppedCardIds] = useState(new Set());

  useEffect(() => {
    const currentContainerRef = containerRef.current;
    if (!currentContainerRef) return;
    const calculateRulerLayout = () => {
      const containerHeight = currentContainerRef.offsetHeight;
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
      const initialCardsData = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `(${(i + 1).toString().padStart(3, '0')})`,
        image: [
          '/cig.png', '/airpod.png', '/starbucks.png', '/starbucks.png', '/glass.png',
          '/keyboard.png', '/iphone.png', '/straw.png', '/pigeon.png', '/um.png'
        ][i],
        position: {
          x: Math.random() * (100 - (CARD_WIDTH_PX / sectionRef.current.offsetWidth * 100)),
          y: Math.random() * (100 - (CARD_HEIGHT_PX / sectionRef.current.offsetHeight * 100))
        },
        velocity: getRandomVelocity(),
        width: CARD_WIDTH_PX,
        height: CARD_HEIGHT_PX,
      }));
      setCards(initialCardsData);
    }
  }, [cards.length]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const handleMouseDown = useCallback((e, cardId) => {
    if (!sectionRef.current) return;
    const cardElement = e.currentTarget;
    const cardRect = cardElement.getBoundingClientRect();
    const offsetX = e.clientX - cardRect.left;
    const offsetY = e.clientY - cardRect.top;
    
    setDraggingCard({ id: cardId, offset: { x: offsetX, y: offsetY } });
    
    if (droppedCardIds.has(cardId)) {
      setDroppedCardIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.delete(cardId);
        return newIds;
      });
    }
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, velocity: { x: 0, y: 0 } } : card
      )
    );
    e.preventDefault(); 
  }, [setDraggingCard, setCards, droppedCardIds, setDroppedCardIds]);

  const handleGlobalMouseMove = useCallback((e) => {
    const cursorX = e.clientX;
    const cursorY = e.clientY;
    cursorPosRef.current = { x: cursorX, y: cursorY };
    setCustomCursorPosition({ x: cursorX, y: cursorY });

    if (draggingCard && sectionRef.current) {
        const sectionRect = sectionRef.current.getBoundingClientRect();
        let newX = cursorX - sectionRect.left - draggingCard.offset.x;
        let newY = cursorY - sectionRect.top - draggingCard.offset.y;
        
        const currentCardData = cards.find(c => c.id === draggingCard.id);
        if (!currentCardData) return;

        let xPercent = (newX / sectionRect.width) * 100;
        let yPercent = (newY / sectionRect.height) * 100;
        const cardWidthPercent = (currentCardData.width / sectionRect.width * 100);
        const cardHeightPercent = (currentCardData.height / sectionRect.height * 100);
        const maxXPercent = 100 - cardWidthPercent;
        const maxYPercent = 100 - cardHeightPercent;
        xPercent = Math.max(0, Math.min(xPercent, maxXPercent));
        yPercent = Math.max(0, Math.min(yPercent, maxYPercent));

        setCards(prevCards => 
          prevCards.map(card => 
            card.id === draggingCard.id 
              ? { ...card, position: { x: xPercent, y: yPercent }, velocity: {x:0, y:0} }
              : card
          )
        );
    } else if (!draggingCard && sectionRef.current) {
        const cursorX = e.clientX;
        const cursorY = e.clientY;
        let newHoveredCardId = null;
        const sectionRect = sectionRef.current.getBoundingClientRect();
        for (const card of cardsRef.current) {
            if (droppedCardIds.has(card.id)) continue;
            const cardLeftPx = (card.position.x / 100) * sectionRect.width + sectionRect.left;
            const cardTopPx = (card.position.y / 100) * sectionRect.height + sectionRect.top;
            const cardBox = { left: cardLeftPx, right: cardLeftPx + card.width, top: cardTopPx, bottom: cardTopPx + card.height };
            if (cursorX >= cardBox.left && cursorX <= cardBox.right && cursorY >= cardBox.top && cursorY <= cardBox.bottom) {
                newHoveredCardId = card.id;
                break;
            }
        }
        hoveredCardIdRef.current = newHoveredCardId;
    }
  }, [draggingCard, cards, setCards]);

  const handleMouseUp = useCallback(() => {
    if (draggingCard && draggingCard.id) {
      const droppedCardId = draggingCard.id;
      console.log('handleMouseUp: Dropping card ID:', droppedCardId);

      const finalCardState = cardsRef.current.find(c => c.id === droppedCardId);
      if (finalCardState) {
        console.log(`handleMouseUp: Finalizing drop for ${droppedCardId} at pos:`, finalCardState.position);
        setCards(prevCards =>
          prevCards.map(c =>
            c.id === droppedCardId
              ? { ...c, position: finalCardState.position, velocity: { x: 0, y: 0 } }
              : c
          )
        );
      }

      setDroppedCardIds(prevIds => {
        const newIds = new Set(prevIds).add(droppedCardId);
        console.log('handleMouseUp: Updated droppedCardIds:', newIds);
        return newIds;
      });
      setDraggingCard(null);
    }
  }, [draggingCard, setCards, setDroppedCardIds, setDraggingCard, cardsRef]);

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
    let frameCount = 0;
    let prevCardsSnapshot = JSON.stringify(cardsRef.current.map(c => ({ id: c.id, position: c.position, velocity: c.velocity })));

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      let hasChangedInThisFrameIteration = false;
      
      const newCardsArray = cardsRef.current.map(card => {
        let updatedCard = { ...card };
        let specificCardChanged = false;

        if (droppedCardIds.has(updatedCard.id)) {
          if (updatedCard.velocity.x !== 0 || updatedCard.velocity.y !== 0) {
            updatedCard.velocity = { x: 0, y: 0 }; 
            specificCardChanged = true;
          }
        } else if (draggingCard && updatedCard.id === draggingCard.id) {
          if (updatedCard.velocity.x !== 0 || updatedCard.velocity.y !== 0) {
            updatedCard.velocity = { x: 0, y: 0 };
            specificCardChanged = true;
          }
        } else if (hoveredCardIdRef.current === updatedCard.id) {
            if (updatedCard.velocity.x !== 0 || updatedCard.velocity.y !== 0) {
               updatedCard.velocity = { x: 0, y: 0 };
               specificCardChanged = true;
            }
        } else {
          let initialVelocity = { ...updatedCard.velocity };
          let initialPosition = { ...updatedCard.position };

          if (updatedCard.velocity.x === 0 && updatedCard.velocity.y === 0) {
            updatedCard.velocity = getRandomVelocity();
          }
          
          const speed = 0.01;
          updatedCard.position.x += updatedCard.velocity.x * speed * deltaTime;
          updatedCard.position.y += updatedCard.velocity.y * speed * deltaTime;

          if (sectionRef.current) {
            const parentWidth = sectionRef.current.offsetWidth;
            const parentHeight = sectionRef.current.offsetHeight;
            const cardWidthPercent = (updatedCard.width / parentWidth * 100);
            const cardHeightPercent = (updatedCard.height / parentHeight * 100);
            const maxX = 100 - cardWidthPercent;
            const maxY = 100 - cardHeightPercent;

            if (updatedCard.position.x <= 0 || updatedCard.position.x >= maxX) {
              updatedCard.velocity.x = -initialVelocity.x;
              updatedCard.position.x = updatedCard.position.x <= 0 ? 0 : maxX;
            }
            if (updatedCard.position.y <= 0 || updatedCard.position.y >= maxY) {
              updatedCard.velocity.y = -initialVelocity.y;
              updatedCard.position.y = updatedCard.position.y <= 0 ? 0 : maxY;
            }
          }
          if (initialPosition.x.toFixed(3) !== updatedCard.position.x.toFixed(3) || 
              initialPosition.y.toFixed(3) !== updatedCard.position.y.toFixed(3) ||
              initialVelocity.x.toFixed(3) !== updatedCard.velocity.x.toFixed(3) ||
              initialVelocity.y.toFixed(3) !== updatedCard.velocity.y.toFixed(3)) {
            specificCardChanged = true;
          }
        }
        if (specificCardChanged) {
            hasChangedInThisFrameIteration = true;
        }
        return updatedCard;
      });

      cardsRef.current = newCardsArray; 
      frameCount++;

      if (hasChangedInThisFrameIteration) { 
        const currentSnapshot = JSON.stringify(cardsRef.current.map(c => ({ id: c.id, position: c.position, velocity: c.velocity })));
        if (currentSnapshot !== prevCardsSnapshot) {
          setCards(newCardsArray); 
          prevCardsSnapshot = currentSnapshot;
        }
      } else if (frameCount % 60 === 0) {
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [cards, draggingCard, droppedCardIds]);

  const handleSectionMouseEnter = () => {
    setIsTextCursorVisible(true);
  };
  const handleSectionMouseLeave = () => {
    hoveredCardIdRef.current = null;
    setIsTextCursorVisible(false);
  };

  const handleCardMouseDown = (e, project) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    handleMouseDown(e, project.id);
  };

  const handleCardMouseUp = (e, project) => {
    const clickThreshold = 5; // px
    const isSimpleClick =
      mouseDownPos &&
      Math.abs(e.clientX - mouseDownPos.x) < clickThreshold &&
      Math.abs(e.clientY - mouseDownPos.y) < clickThreshold;

    if (isSimpleClick) {
      setSelectedProject(project);
    }
    setDraggingCard(null);
    setMouseDownPos(null); 
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    let localStream = null; // To store the stream locally for cleanup

    async function setupWebcamAndCocoSsd() {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await tf.ready();
          console.log("TensorFlow.js backend ready:", tf.getBackend());

          cocoSsdModelRef.current = await cocoSsd.load();
          console.log("CocoSSD model loaded.");

          localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              console.log("Webcam stream started.");
              detectFrameContents();
            };
          }
        } catch (error) {
          console.error("Error setting up webcam or CocoSSD model:", error);
        }
      }
    }

    setupWebcamAndCocoSsd();

    return () => {
      console.log("Cleaning up webcam and models...");
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        // Double check to ensure tracks are stopped if localStream somehow failed to be the source
        const currentSrcObject = videoRef.current.srcObject;
        if (typeof currentSrcObject.getTracks === 'function') {
            currentSrcObject.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
      }
      if (cocoSsdModelRef.current && typeof cocoSsdModelRef.current.dispose === 'function') {
        cocoSsdModelRef.current.dispose();
        cocoSsdModelRef.current = null;
      }
      console.log("Cleanup complete.");
    };
  }, [isClient]); // This effect runs when isClient changes (specifically when it becomes true)

  const detectFrameContents = async () => {
    if (
      !videoRef.current ||
      videoRef.current.readyState < 2 || 
      !cocoSsdModelRef.current ||
      !canvasRef.current
    ) {
      requestRef.current = requestAnimationFrame(detectFrameContents);
      return;
    }
  
    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
  
    if (videoWidth === 0 || videoHeight === 0) {
      requestRef.current = requestAnimationFrame(detectFrameContents);
      return;
    }
  
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    const context = canvasRef.current.getContext('2d');
    context.clearRect(0, 0, videoWidth, videoHeight);
    // context.drawImage(video, 0, 0, videoWidth, videoHeight); // Optionally draw video to canvas
  
    const predictions = await cocoSsdModelRef.current.detect(video);
    let detectedObjectNameForState = '';
    let currentCellphoneDetected = false;
    let currentKeyboardDetected = false;
    let currentCupDetected = false;
  
    let objectBeingTimed = currentlyTimedObjectRef.current;
    let objectDetectedThisFrame = null;

    for (let i = 0; i < predictions.length; i++) {
      const obj = predictions[i];
      // Draw bounding box (optional, can be enabled for debugging)
      // context.beginPath();
      // context.rect(obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3]);
      // context.lineWidth = 2;
      // context.strokeStyle = 'red';
      // context.fillStyle = 'red';
      // context.stroke();
      // context.fillText(
      //   `${obj.class} (${Math.round(parseFloat(obj.score) * 100)}%)`,
      //   obj.bbox[0],
      //   obj.bbox[1] > 10 ? obj.bbox[1] - 5 : 10
      // );
  
      if (detectionStates[obj.class] && obj.score > 0.6) { // Confidence threshold
        objectDetectedThisFrame = obj.class;
        if (objectBeingTimed === '' || objectBeingTimed === obj.class) {
          if (objectBeingTimed === '') {
            currentlyTimedObjectRef.current = obj.class;
            setLabelObjectStartTime(Date.now());
            objectBeingTimed = obj.class; 
          }
          detectedObjectNameForState = obj.class;
          const timeHeld = Date.now() - (labelObjectStartTime || Date.now());
          
          if (timeHeld > 2000 && !detectionStates[obj.class].popupShown) { // 2 seconds hold
            setDetectionStates(prev => ({
              ...prev,
              [obj.class]: { ...prev[obj.class], popupShown: true, startTime: Date.now() }
            }));
            // Auto-select project if corresponding card is found
            const projectToPopup = cardsRef.current.find(card => card.image === detectionStates[obj.class].imagePath);
            if (projectToPopup && (!selectedProject || selectedProject.id !== projectToPopup.id)) {
                setSelectedProject(projectToPopup);
            }
          }
        }
        if (obj.class === 'cell phone') currentCellphoneDetected = true;
        else if (obj.class === 'keyboard') currentKeyboardDetected = true;
        else if (obj.class === 'cup') currentCupDetected = true;
      }
    }

    if (objectDetectedThisFrame === null && objectBeingTimed !== '') {
      currentlyTimedObjectRef.current = '';
      setLabelObjectStartTime(null);
    }
  
    // Reset popupShown after 5 seconds
    Object.keys(detectionStates).forEach(key => {
      if (detectionStates[key].popupShown && (Date.now() - (detectionStates[key].startTime || 0) > 5000)) {
        setDetectionStates(prev => ({ ...prev, [key]: { ...prev[key], popupShown: false, startTime: null } }));
      }
    });
  
    setDetectedObjectName(detectedObjectNameForState);
    setIsCellphoneDetected(currentCellphoneDetected);
    setIsKeyboardDetected(currentKeyboardDetected);
    setIsCupDetected(currentCupDetected);
  
    requestRef.current = requestAnimationFrame(detectFrameContents);
  };

  const handleNextButtonClick = () => {
    router.push('/project');
  };

  return (
    <Container className={spaceMono.className} ref={containerRef}>
      {isClient && (
        <>
          <WebcamContainer>
            <video ref={videoRef} autoPlay playsInline muted />
            <canvas ref={canvasRef} />
          </WebcamContainer>
          <WebcamLabel>
            <div>object: {detectedObjectName || '...'}</div>
          </WebcamLabel>
        </>
      )}

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

      {isTextCursorVisible && (
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

      <Header>
        <Title>Artifacts of Tomorrow</Title>
        <Subtitle>Welcome. This is a unique space where we view our present day through the perspective of the future. How might curators from 2190 interpret our ordinary objects like smartphones, headphones, and books?
        Move the time slider to change the year, select an exhibit, and present a curator card to experience how today's objects transform and are reinterpreted from various perspectives.</Subtitle>
      </Header>

      <Section 
        ref={sectionRef}
        onMouseEnter={handleSectionMouseEnter}
        onMouseLeave={handleSectionMouseLeave}
        onMouseMove={handleGlobalMouseMove}
      >
        {cards.map((project) => {
            const isIphoneCard = project.image === '/iphone.png';
            const isKeyboardCard = project.image === '/keyboard.png';
            const isStarbucksCard = project.image === '/starbucks.png';
            
            let textArtColorFromWebcam = undefined;
            if (isCellphoneDetected && isIphoneCard) {
              textArtColorFromWebcam = '#FF007F';
            }
            if (isKeyboardDetected && isKeyboardCard) {
              textArtColorFromWebcam = '#FF007F';
            }
            if (isCupDetected && isStarbucksCard) {
              textArtColorFromWebcam = '#FF007F';
            }

            const finalColor = droppedCardIds.has(project.id) ? 'yellow' : textArtColorFromWebcam;
            console.log(`ProjectCard Render: Card ${project.id} - isDropped: ${droppedCardIds.has(project.id)}, finalColor: ${finalColor}`);

            let marginTopValue = '80px';
            if (project.id === '5' || project.id === '6') {
              marginTopValue = '130px';
            }
            const textArtCustomStyle = { marginTop: marginTopValue };

            return (
              <ProjectCard 
                key={project.id}
                onMouseDown={(e) => handleCardMouseDown(e, project)}
                onMouseUp={(e) => handleCardMouseUp(e, project)}
                style={{
                  left: `${project.position.x}%`,
                  top: `${project.position.y}%`,
                  transform: draggingCard && draggingCard.id === project.id ? 'scale(1.1)' : 'scale(1.0)',
                  zIndex: (draggingCard && draggingCard.id === project.id) || droppedCardIds.has(project.id) ? 1001 : 1000,
                  userSelect: 'none',
                  pointerEvents: 'auto',
                }}
              >
                <h3>{project.title}</h3>
                {project.image && (
                  <TextArt 
                    src={project.image} 
                    fontSize="0.6rem" 
                    hoverEffect={!droppedCardIds.has(project.id) && project.id !== hoveredCardIdRef.current}
                    color={finalColor}
                    style={textArtCustomStyle}
                  />
                )}
              </ProjectCard>
            );
        })}
      </Section>

      <ProjectPopup
        open={!!selectedProject}
        project={selectedProject}
        onClose={() => {
            setSelectedProject(null);
            const newStates = { ...detectionStates };
            let popupReset = false;
            if (selectedProject) {
              Object.keys(newStates).forEach(className => {
                const cardImage = cardsRef.current.find(card => card.id === selectedProject.id)?.image;
                if (cardImage === newStates[className].imagePath) {
                  if(newStates[className].popupShown) {
                    newStates[className] = { ...newStates[className], popupShown: false, startTime: null };
                    popupReset = true;
                  }
                }
              });
            }
            if(popupReset) {
              setDetectionStates(newStates);
            }
        }}
        onMore={() => {
          if (selectedProject) {
            router.push(`/project/${selectedProject.id}`);
            setSelectedProject(null);
          }
        }}
      />

      <NextButton onClick={handleNextButtonClick}>
        next
      </NextButton>
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