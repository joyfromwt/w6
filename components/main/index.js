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
  NextButton,
  AllCardsDroppedPopupOverlay,
  AllCardsDroppedPopupContent
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
const DRAG_SCALE = 1.1;
const CARD_PLACEMENT_GAP_PERCENT = 2; // Gap between auto-placed cards

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
  const [isAllCardsDroppedPopupVisible, setIsAllCardsDroppedPopupVisible] = useState(false);
  const [sortedDroppedCardNames, setSortedDroppedCardNames] = useState([]);
  const animateLoopIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const prevAnimateSnapshotRef = useRef(null);
  const [lastFixedCardInfo, setLastFixedCardInfo] = useState(null);
  const prevDroppedCardIdsRef = useRef(new Set());
  const droppedCardIdsRef = useRef(droppedCardIds);

  useEffect(() => {
    droppedCardIdsRef.current = droppedCardIds;
  }, [droppedCardIds]);

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
          '/cigarette.png',
          '/airpod.png',
          '/starbucks.png',
          '/starbucks.png',
          '/glass.png',
          '/keyboard.png',
          '/iphone.png',
          '/straw.png',
          '/pigeon.png',
          '/umbrella.png'
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
    // e.preventDefault(); // Prevent text selection, etc.

    const cardBeingDragged = cardsRef.current.find(c => c.id === cardId);
    if (!cardBeingDragged) return;

    setDraggingCard({
      id: cardId,
      initialClientX: e.clientX,
      initialClientY: e.clientY,
      // Store the card's base position in pixels when drag started, relative to the sectionRef container
      // This helps if the card's base % position is complex to get back to px later on drop
      // However, for now, we'll recalculate on drop from its % position + translate
      currentTranslateX: 0, // Initial translation is zero
      currentTranslateY: 0,
    });
    
    if (droppedCardIds.has(cardId)) {
      setDroppedCardIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.delete(cardId);
        return newIds;
      });
    }

    // Set velocity of the card being dragged to 0 in the main cards array
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, velocity: { x: 0, y: 0 } } : card
      )
    );
    // No e.preventDefault() here, allow default for mousedown if needed elsewhere, but ProjectCard should handle it.
  }, [setCards, cardsRef, droppedCardIds, setDroppedCardIds]); // Added cardsRef

  const handleGlobalMouseMove = useCallback((e) => {
    cursorPosRef.current = { x: e.clientX, y: e.clientY }; // Keep this for text cursor
    setCustomCursorPosition({ x: e.clientX, y: e.clientY }); // Keep this for text cursor

    if (draggingCard && sectionRef.current) {
      const deltaX = e.clientX - draggingCard.initialClientX;
      const deltaY = e.clientY - draggingCard.initialClientY;
      
      setDraggingCard(prev => {
        if (!prev) return null; // Should not happen if draggingCard is set
        return { 
          ...prev, 
          currentTranslateX: deltaX, 
          currentTranslateY: deltaY 
        };
      });
    } else if (!draggingCard && sectionRef.current) { // Hover logic remains unchanged
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
  }, [draggingCard, setCustomCursorPosition, cardsRef, droppedCardIds]); // setCards removed, setCustomCursorPosition added, cardsRef, droppedCardIds added

  const handleMouseUp = useCallback(() => {
    if (draggingCard && sectionRef.current) {
      const { id: draggedId, currentTranslateX, currentTranslateY } = draggingCard;
      const sectionRect = sectionRef.current.getBoundingClientRect();

      // Update both cards state and cardsRef.current simultaneously for immediate reflection in animate loop
      setCards(prevCards => {
        const updatedCards = prevCards.map(card => {
          if (card.id === draggedId) {
            const cardToUpdate = card; // prevCards.find(c => c.id === draggedId) is essentially this card
            const basePositionXPx = (cardToUpdate.position.x / 100) * sectionRect.width;
            const basePositionYPx = (cardToUpdate.position.y / 100) * sectionRect.height;
            const finalPositionXPx = basePositionXPx + currentTranslateX;
            const finalPositionYPx = basePositionYPx + currentTranslateY;
            let newPositionXPercent = (finalPositionXPx / sectionRect.width) * 100;
            let newPositionYPercent = (finalPositionYPx / sectionRect.height) * 100;
            const cardWidthPercent = (cardToUpdate.width / sectionRect.width) * 100;
            const cardHeightPercent = (cardToUpdate.height / sectionRect.height) * 100;
            const maxXPercent = 100 - cardWidthPercent;
            const maxYPercent = 100 - cardHeightPercent;
            newPositionXPercent = Math.max(0, Math.min(newPositionXPercent, maxXPercent));
            newPositionYPercent = Math.max(0, Math.min(newPositionYPercent, maxYPercent));
            return { ...card, position: { x: newPositionXPercent, y: newPositionYPercent }, velocity: { x: 0, y: 0 } };
          } 
          return card;
        });
        // Directly update cardsRef.current to ensure animate function sees the zero velocity immediately
        cardsRef.current = updatedCards; 
        // Also update the snapshot used by animate to prevent unnecessary setCards call from animate itself
        prevAnimateSnapshotRef.current = JSON.stringify(updatedCards.map(c => ({ id: c.id, position: c.position, velocity: c.velocity })));
        return updatedCards;
      });

      setDroppedCardIds(prevIds => new Set(prevIds).add(draggedId));
      setDraggingCard(null); 
    }
  }, [draggingCard, setCards, setDroppedCardIds, sectionRef, cardsRef, prevAnimateSnapshotRef]); // Added cardsRef and prevAnimateSnapshotRef to dependencies

  // useEffect for event listeners (mousemove, mouseup)
  useEffect(() => {
    // handleGlobalMouseMove is always active for the text cursor and hover effects
    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    if (draggingCard) {
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove); // This was always added
      // Only remove mouseup if it was potentially added
      document.removeEventListener('mouseup', handleMouseUp); 
    };
  }, [draggingCard, handleGlobalMouseMove, handleMouseUp]);
  
  useEffect(() => {
    if (cards.length === 0) {
      if (animateLoopIdRef.current) {
        cancelAnimationFrame(animateLoopIdRef.current);
        animateLoopIdRef.current = null;
      }
      return;
    }

    // Initialize lastTimeRef only if the loop is not already running
    if (!animateLoopIdRef.current) {
        lastTimeRef.current = performance.now();
        prevAnimateSnapshotRef.current = JSON.stringify(
          cardsRef.current.map(c => ({ id: c.id, position: c.position, velocity: c.velocity }))
        );
    }
    
    let frameCount = 0; 

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current; // Use ref
      lastTimeRef.current = currentTime; // Update ref
      let hasChangedInThisFrameIteration = false;
      
      const currentDraggingCard = draggingCard; // Read current state for this frame
      const currentDroppedCardIds = droppedCardIdsRef.current; // Use ref for droppedCardIds

      const currentCardsFromRef = cardsRef.current; 
      const newCardsArray = currentCardsFromRef.map(card => {
        let updatedCard = { ...card };
        let specificCardChanged = false;

        if (currentDroppedCardIds.has(updatedCard.id)) {
          if (updatedCard.velocity.x !== 0 || updatedCard.velocity.y !== 0) {
            updatedCard.velocity = { x: 0, y: 0 }; 
            specificCardChanged = true;
          }
        } else if (currentDraggingCard && updatedCard.id === currentDraggingCard.id) {
          if (updatedCard.velocity.x !== 0 || updatedCard.velocity.y !== 0) {
            updatedCard.velocity = { x: 0, y: 0 };
            specificCardChanged = true;
          }
        } else {
          // Default: Cards that should be moving
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
            if (updatedCard.position.x <= 0) { updatedCard.position.x = 0; updatedCard.velocity.x = -updatedCard.velocity.x; } 
            else if (updatedCard.position.x >= maxX) { updatedCard.position.x = maxX; updatedCard.velocity.x = -updatedCard.velocity.x; }
            if (updatedCard.position.y <= 0) { updatedCard.position.y = 0; updatedCard.velocity.y = -updatedCard.velocity.y; } 
            else if (updatedCard.position.y >= maxY) { updatedCard.position.y = maxY; updatedCard.velocity.y = -updatedCard.velocity.y; }
          }
          if (initialPosition.x.toFixed(3) !== updatedCard.position.x.toFixed(3) || 
              initialPosition.y.toFixed(3) !== updatedCard.position.y.toFixed(3) ||
              initialVelocity.x.toFixed(3) !== updatedCard.velocity.x.toFixed(3) ||
              initialVelocity.y.toFixed(3) !== updatedCard.velocity.y.toFixed(3) ||
              (initialVelocity.x === 0 && initialVelocity.y === 0 && (updatedCard.velocity.x !==0 || updatedCard.velocity.y !== 0))
              ) { specificCardChanged = true; }
        }
        
        if (specificCardChanged) {
            hasChangedInThisFrameIteration = true;
        }
        return updatedCard;
      });

      frameCount++;
      if (hasChangedInThisFrameIteration) { 
        const currentSnapshot = JSON.stringify(newCardsArray.map(c => ({ id: c.id, position: c.position, velocity: c.velocity })));
        if (currentSnapshot !== prevAnimateSnapshotRef.current) {
          // Critical: Update cardsRef.current BEFORE setCards to ensure next frame reads the change if setCards is async
          cardsRef.current = newCardsArray; 
          prevAnimateSnapshotRef.current = currentSnapshot;
          setCards(newCardsArray); 
        }
      }
      animateLoopIdRef.current = requestAnimationFrame(animate);
    };

    animateLoopIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animateLoopIdRef.current) {
        cancelAnimationFrame(animateLoopIdRef.current);
        animateLoopIdRef.current = null;
      }
    };
  }, [cards.length, setCards]); // MODIFIED dependencies: removed draggingCard, droppedCardIds. `setCards` is stable.
                                // `draggingCard` and `droppedCardIds` will be read directly from state inside `animate`.

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
    const clickThreshold = 5;
    const isSimpleClick =
      mouseDownPos &&
      Math.abs(e.clientX - mouseDownPos.x) < clickThreshold &&
      Math.abs(e.clientY - mouseDownPos.y) < clickThreshold;

    if (isSimpleClick) {
      setSelectedProject(project);
    }
    setMouseDownPos(null); 
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    let localStream = null;

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
  }, [isClient]);

  const detectFrameContents = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !cocoSsdModelRef.current || !canvasRef.current || !sectionRef.current) {
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
  
    const predictions = await cocoSsdModelRef.current.detect(video);
    let detectedObjectNameForState = '';
    let currentCellphoneDetected = false;
    let currentKeyboardDetected = false;
    let currentCupDetected = false;
  
    let objectBeingTimed = currentlyTimedObjectRef.current;
    let objectDetectedThisFrame = null;

    for (let i = 0; i < predictions.length; i++) {
      const obj = predictions[i];
      if (detectionStates[obj.class] && obj.score > 0.6) {
        objectDetectedThisFrame = obj.class;
        
        if (objectBeingTimed === '' || objectBeingTimed === obj.class) {
          if (objectBeingTimed === '') {
            currentlyTimedObjectRef.current = obj.class;
            objectBeingTimed = obj.class; 
          }
          detectedObjectNameForState = obj.class;
          
          if (!detectionStates[obj.class].popupShown) { 
            setDetectionStates(prev => ({ 
              ...prev, 
              [obj.class]: { ...prev[obj.class], popupShown: true, startTime: Date.now() }
            }));
            
            const projectToPopup = cardsRef.current.find(card => card.image === detectionStates[obj.class].imagePath);
            
            // Auto-fix card position if detected, associated card exists, and not already dropped/fixed
            if (projectToPopup && sectionRef.current && !droppedCardIds.has(projectToPopup.id)) {
              const targetCardId = projectToPopup.id;
              const targetCardData = cardsRef.current.find(c => c.id === targetCardId);

              if (targetCardData) {
                let newXPercent, newYPercent;
                const targetCardWidthPercent = (targetCardData.width / sectionRef.current.offsetWidth) * 100;
                const targetCardHeightPercent = (targetCardData.height / sectionRef.current.offsetHeight) * 100;

                if (lastFixedCardInfo && lastFixedCardInfo.id !== targetCardId) {
                  newXPercent = lastFixedCardInfo.xPercent + lastFixedCardInfo.widthPercent + CARD_PLACEMENT_GAP_PERCENT;
                  newYPercent = lastFixedCardInfo.yPercent;
                  if (newXPercent + targetCardWidthPercent > (100 - CARD_PLACEMENT_GAP_PERCENT)) {
                    newXPercent = CARD_PLACEMENT_GAP_PERCENT;
                    newYPercent = (lastFixedCardInfo.yPercent + targetCardHeightPercent + CARD_PLACEMENT_GAP_PERCENT); 
                     if (newYPercent + targetCardHeightPercent > (100 - CARD_PLACEMENT_GAP_PERCENT)) {
                        newYPercent = 100 - targetCardHeightPercent - CARD_PLACEMENT_GAP_PERCENT;
                    }
                  }
                } else { 
                  newXPercent = CARD_PLACEMENT_GAP_PERCENT; 
                  newYPercent = CARD_PLACEMENT_GAP_PERCENT;
                }

                newXPercent = Math.max(CARD_PLACEMENT_GAP_PERCENT, Math.min(newXPercent, 100 - targetCardWidthPercent - CARD_PLACEMENT_GAP_PERCENT));
                newYPercent = Math.max(CARD_PLACEMENT_GAP_PERCENT, Math.min(newYPercent, 100 - targetCardHeightPercent - CARD_PLACEMENT_GAP_PERCENT));
                
                // Apply new position AND set velocity to 0 immediately
                setCards(prevCards => {
                  const updatedCards = prevCards.map(c =>
                    c.id === targetCardId
                      ? { ...c, position: { x: newXPercent, y: newYPercent }, velocity: { x: 0, y: 0 } } // Ensure velocity is zeroed here
                      : c
                  );
                  // Directly update refs for immediate reflection in animate loop
                  cardsRef.current = updatedCards;
                  prevAnimateSnapshotRef.current = JSON.stringify(updatedCards.map(c => ({ id: c.id, position: c.position, velocity: c.velocity })));
                  return updatedCards;
                });
                // Then, add to droppedCardIds. The animate function will respect this on the next frame.
                setDroppedCardIds(prevIds => new Set(prevIds).add(targetCardId)); 
              }
            }
          }
          if (obj.class === 'cell phone') currentCellphoneDetected = true;
          else if (obj.class === 'keyboard') currentKeyboardDetected = true;
          else if (obj.class === 'cup') currentCupDetected = true;
        }
        if (objectDetectedThisFrame === null && objectBeingTimed !== '') {
          currentlyTimedObjectRef.current = '';
          setLabelObjectStartTime(null);
        }
      }
    }
  
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
    router.push('/more');
  };

  // useEffect to check if all cards are dropped and show popup
  useEffect(() => {
    if (cards.length === 0) return; // Don't run if no cards are initialized

    const allCardsAreDropped = cards.every(card => droppedCardIds.has(card.id));

    if (allCardsAreDropped) {
      const sortedCards = [...cards]
        .filter(card => droppedCardIds.has(card.id)) // Ensure only dropped cards are considered (redundant if allCardsAreDropped is true, but safe)
        .sort((a, b) => a.position.x - b.position.x);
      
      const names = sortedCards.map(card => {
        const imageNameWithExt = card.image.split('/').pop(); // e.g., "iphone.png"
        return imageNameWithExt.substring(0, imageNameWithExt.lastIndexOf('.')) || imageNameWithExt; // "iphone"
      });
      
      setSortedDroppedCardNames(names);
      setIsAllCardsDroppedPopupVisible(true);
    } else {
      // This part is important if cards can be "undropped" or state changes
      // to ensure popup doesn't persist if condition is no longer met.
      // However, based on current logic, once all are dropped, they stay dropped.
      // setIsAllCardsDroppedPopupVisible(false); // Consider if needed for other flows
    }
  }, [droppedCardIds, cards]); // cards dependency might be too frequent if cards object itself changes often without content change.
                                // Consider cards.length or a more stable derivative if performance issues arise.

  // useEffect for automatic navigation after popup
  useEffect(() => {
    let navigationTimer;
    if (isAllCardsDroppedPopupVisible) {
      navigationTimer = setTimeout(() => {
        router.push('/more');
      }, 3000); // 3 seconds
    }
    return () => {
      clearTimeout(navigationTimer); // Cleanup timer on unmount or if popup closes before 3s
    };
  }, [isAllCardsDroppedPopupVisible, router]);

  // useEffect to update lastFixedCardInfo when a card is dropped or auto-fixed
  useEffect(() => {
    if (!sectionRef.current || sectionRef.current.offsetWidth === 0 || sectionRef.current.offsetHeight === 0) {
      // sectionRef is not ready or has no dimensions, cannot calculate percentages.
      // If lastFixedCardInfo is already set, and section becomes temporarily 0,
      // we might choose to clear it or keep the stale info. For now, just return.
      return;
    }

    const currentDroppedIds = droppedCardIdsRef.current; // Use ref for latest IDs
    const previousDroppedIdsSnapshot = prevDroppedCardIdsRef.current;

    let cardToUpdateInfoFrom = null;

    if (currentDroppedIds.size > previousDroppedIdsSnapshot.size) {
      // Card(s) were added to droppedCardIds
      const newIds = [...currentDroppedIds].filter(id => !previousDroppedIdsSnapshot.has(id));
      if (newIds.length > 0) {
        const lastTrulyAddedId = newIds[newIds.length - 1];
        const cardData = cardsRef.current.find(card => card.id === lastTrulyAddedId);
        if (cardData) {
          cardToUpdateInfoFrom = cardData;
        }
      }
    } else if (currentDroppedIds.size < previousDroppedIdsSnapshot.size) {
      // Card(s) were removed from droppedCardIds
      if (lastFixedCardInfo && !currentDroppedIds.has(lastFixedCardInfo.id)) {
        // The current lastFixedCardInfo was removed. Find a new one if possible.
        if (currentDroppedIds.size > 0) {
          // Simplistic: take the last one from the array representation of the current set.
          // This doesn't guarantee "most recent" if multiple were removed then one added back etc.
          // but it's consistent with previous logic for finding a replacement.
          const lastRemainingIdArray = [...currentDroppedIds];
          const lastPotentialId = lastRemainingIdArray[lastRemainingIdArray.length - 1];
          const cardData = cardsRef.current.find(card => card.id === lastPotentialId);
          if (cardData) {
            cardToUpdateInfoFrom = cardData;
          } else {
            setLastFixedCardInfo(null); // No suitable replacement found
          }
        } else {
          setLastFixedCardInfo(null); // All cards un-dropped
        }
      } else if (lastFixedCardInfo && currentDroppedIds.has(lastFixedCardInfo.id)) {
        // Current lastFixedCardInfo is still valid, but its data might need an update (e.g. position)
        const cardData = cardsRef.current.find(card => card.id === lastFixedCardInfo.id);
        if (cardData) {
          cardToUpdateInfoFrom = cardData;
        }
      }
    } else if (lastFixedCardInfo && currentDroppedIds.has(lastFixedCardInfo.id)) {
        // Sizes are the same, but the data for the existing lastFixedCardInfo might have changed
        const cardData = cardsRef.current.find(card => card.id === lastFixedCardInfo.id);
        if (cardData) {
          cardToUpdateInfoFrom = cardData;
        }
    } else if (currentDroppedIds.size > 0 && !lastFixedCardInfo) {
        // No lastFixedCardInfo, but there are dropped cards. Initialize.
        const lastRemainingIdArray = [...currentDroppedIds];
        const lastPotentialId = lastRemainingIdArray[lastRemainingIdArray.length - 1];
        const cardData = cardsRef.current.find(card => card.id === lastPotentialId);
        if (cardData) {
          cardToUpdateInfoFrom = cardData;
        }
    }


    if (cardToUpdateInfoFrom) {
      const newInfo = {
        id: cardToUpdateInfoFrom.id,
        xPercent: cardToUpdateInfoFrom.position.x,
        yPercent: cardToUpdateInfoFrom.position.y,
        widthPercent: (cardToUpdateInfoFrom.width / sectionRef.current.offsetWidth) * 100,
        heightPercent: (cardToUpdateInfoFrom.height / sectionRef.current.offsetHeight) * 100,
      };
      // Only update state if the information has actually changed to prevent unnecessary re-renders.
      if (JSON.stringify(newInfo) !== JSON.stringify(lastFixedCardInfo)) {
        setLastFixedCardInfo(newInfo);
      }
    } else if (currentDroppedIds.size === 0 && lastFixedCardInfo !== null) {
      // If all cards are un-dropped (or no suitable card found), clear lastFixedCardInfo
      setLastFixedCardInfo(null);
    }

    // This ref must be updated *after* comparing currentDroppedIds with its previous state.
    prevDroppedCardIdsRef.current = new Set(currentDroppedIds);
  }, [droppedCardIds, cards, lastFixedCardInfo]); // dependencies: droppedCardIds to trigger, cards for data, lastFixedCardInfo for comparison in set.

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

            let marginTopValue = '80px';
            if (project.id === '5' || project.id === '6') {
              marginTopValue = '130px';
            }
            const textArtCustomStyle = { marginTop: marginTopValue };

            return (
              <ProjectCard 
                key={project.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // Specifically prevent default on card mousedown
                  handleMouseDown(e, project.id); // Pass original event and id
                }}
                // onMouseUp is handled by the global handleMouseUp now for drag release
                style={{
                  left: `${project.position.x}%`,
                  top: `${project.position.y}%`,
                  transform: (draggingCard && draggingCard.id === project.id) 
                    ? `translate(${draggingCard.currentTranslateX}px, ${draggingCard.currentTranslateY}px) scale(${DRAG_SCALE})` 
                    : 'scale(1.0)',
                  transformOrigin: '50% 50%', // Center origin for scale
                  zIndex: (draggingCard && draggingCard.id === project.id) || droppedCardIds.has(project.id) ? 1001 : 1000,
                  userSelect: 'none',
                  pointerEvents: 'auto',
                  // Add transition for smoother snap-back if desired, but can make drag feel laggy.
                  // transition: draggingCard && draggingCard.id === project.id ? 'none' : 'transform 0.2s ease-out',
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

      {/* All Cards Dropped Popup */}
      {isAllCardsDroppedPopupVisible && (
        // Overlay click still closes, which will cancel the timer due to isAllCardsDroppedPopupVisible changing
        <AllCardsDroppedPopupOverlay onClick={() => setIsAllCardsDroppedPopupVisible(false)}>
          <AllCardsDroppedPopupContent onClick={(e) => e.stopPropagation()}>
            <h4>All Artifacts Secured!</h4>
            <p>Order of acquisition (by X-coordinate):</p>
            <ul>
              {sortedDroppedCardNames.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
            {/* <button onClick={() => setIsAllCardsDroppedPopupVisible(false)}>Close</button> */}{/* Button removed */}
          </AllCardsDroppedPopupContent>
        </AllCardsDroppedPopupOverlay>
      )}

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
  const speed = 0.4 + Math.random() * 0.2;
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  };
}; 