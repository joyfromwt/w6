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
  WebcamWrapper,
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
import useAnimationSequence from '../../hooks/useAnimationSequence';
import GridReveal from './animation/GridReveal';
import CardSequence from './animation/CardSequence';
import Typewriter from './animation/Typewriter';

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const CARD_WIDTH_PX = 200;
const CARD_HEIGHT_PX = 200;
const FIST_RESET_COOLDOWN_MS = 3000;
const DRAG_SCALE = 1.1;
const CARD_PLACEMENT_GAP_PERCENT = 2; // Gap between auto-placed cards

const SUBTITLE_TEXT = `Welcome. This is a unique space where we view our present day through the perspective of the future. How might curators from 2190 interpret our ordinary objects like smartphones, headphones, and books? Move the time slider to change the year, select an exhibit, and present a curator card to experience how today's objects transform and are reinterpreted from various perspectives.`;

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
  const [popupImages, setPopupImages] = useState([]);
  const [currentPopupImageIndex, setCurrentPopupImageIndex] = useState(0);
  const [nextButtonClicked, setNextButtonClicked] = useState(false);
  const [randomSquares, setRandomSquares] = useState([]);
  const [croppedImageUrls, setCroppedImageUrls] = useState([]);
  const [lineCoordinates, setLineCoordinates] = useState([]);
  const animateLoopIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const mainContentRef = useRef(null);
  const prevAnimateSnapshotRef = useRef(null);
  const [lastFixedCardInfo, setLastFixedCardInfo] = useState(null);
  const prevDroppedCardIdsRef = useRef(new Set());
  const droppedCardIdsRef = useRef(droppedCardIds);
  const [webcamError, setWebcamError] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('grid');

  const {
    phase,
    isGridVisible,
    isHeaderVisible,
    isCardsVisible,
    startNextPhase
  } = useAnimationSequence();

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

  const handleCardClick = (project) => {
    // Navigate directly to the more page, skipping the popup.
    const cardTitle = project.title.replace(/[()]/g, '');
    const imageName = project.image.replace('/','').replace('.png','');
    const words = [cardTitle, imageName];
    
    const queryString = words.map(word => encodeURIComponent(word)).join(',');
    router.push(`/more?words=${queryString}`);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isAllCardsDroppedPopupVisible) {
      // 팝업이 보이거나 클라이언트가 아니면 웹캠을 설정하지 않고,
      // 이전 effect의 cleanup 함수가 호출되어 리소스를 정리합니다.
      return;
    }

    let localStream = null;

    async function setupWebcamAndCocoSsd() {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          setWebcamError(false);
          await tf.ready();
          console.log("TensorFlow.js backend ready:", tf.getBackend());

          cocoSsdModelRef.current = await cocoSsd.load();
          console.log("CocoSSD model loaded.");

          localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play();
                console.log("Webcam stream started.");
                detectFrameContents();
                // 카메라 준비 완료! 다음 단계로 진행
                if (animationPhase === 'camera') {
                  handleCameraReady();
                }
              }
            };
          }
        } catch (error) {
          console.error("Error setting up webcam or CocoSSD model:", error);
          setWebcamError(true);
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
  }, [isClient, isAllCardsDroppedPopupVisible, animationPhase]);

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
      
      // Draw the bounding box and label
      context.beginPath();
      context.rect(obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3]);
      context.lineWidth = 1;
      context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      context.stroke();
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.fillText(
        `${obj.class} (${Math.round(obj.score * 100)}%)`,
        obj.bbox[0],
        obj.bbox[1] > 10 ? obj.bbox[1] - 5 : 10
      );

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
    if (cards.length > 0) {
      setNextButtonClicked(true);
    }
  };

  // 1. 팝업 트리거 및 초기 콘텐츠 설정
  useEffect(() => {
    const shouldTriggerPopup = (cards.length > 0 && droppedCardIds.size >= 1) || nextButtonClicked;

    if (shouldTriggerPopup) {
      if (!isAllCardsDroppedPopupVisible) {
        let imagesForPopup = [];
        let namesForPopup = [];

        if (droppedCardIds.size === 1 && !nextButtonClicked) {
          // 시나리오 1: 카드 1개만 내려놓은 경우
          const droppedId = [...droppedCardIds][0];
          const droppedCard = cards.find(card => card.id === droppedId);
          if (droppedCard) {
            imagesForPopup = [droppedCard.image];
            namesForPopup = [droppedCard.title];
          }
        } else {
          // 시나리오 2: 여러 카드 또는 Next 버튼 클릭
          const sortedCards = [...cards].sort((a, b) => a.position.x - b.position.x);
          namesForPopup = sortedCards.map(card => card.title);

          const allImages = cards.map(card => card.image);
          const shuffled = allImages.sort(() => 0.5 - Math.random());
          imagesForPopup = shuffled.slice(0, 3);
        }

        setPopupImages(imagesForPopup);
        setCurrentPopupImageIndex(0);
        setSortedDroppedCardNames(namesForPopup);
        setIsAllCardsDroppedPopupVisible(true);
      }
    } else {
      if (isAllCardsDroppedPopupVisible) {
        setIsAllCardsDroppedPopupVisible(false);
        setLineCoordinates([]);
      }
    }
  }, [cards, droppedCardIds, nextButtonClicked, isAllCardsDroppedPopupVisible]);

  // 2. 현재 이미지에 대한 캔버스 로직 (사각형 위치, 크롭 이미지 생성)
  useEffect(() => {
    if (!isAllCardsDroppedPopupVisible || popupImages.length === 0) return;

    const randomImageSrc = popupImages[currentPopupImageIndex];
    if (!randomImageSrc) return;

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = randomImageSrc;

    img.onload = () => {
      const analysisCanvas = document.createElement('canvas');
      const imageSize = 300;
      const squareSize = 20;
      analysisCanvas.width = imageSize;
      analysisCanvas.height = imageSize;
      const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, imageSize, imageSize);
      
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, imageSize, imageSize).data;
      } catch (e) {
        console.error("Error getting image data:", e);
        setRandomSquares([]);
        setCroppedImageUrls([]);
        return;
      }

      const validCenterPoints = [];
      const margin = 10;
      for (let y = margin; y < imageSize - margin; y++) {
        for (let x = margin; x < imageSize - margin; x++) {
          const alphaIndex = (y * imageSize + x) * 4 + 3;
          if (imageData[alphaIndex] > 50) {
            validCenterPoints.push({ x, y });
          }
        }
      }
      
      const squares = [];
      if (validCenterPoints.length > 0) {
        for (let i = validCenterPoints.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [validCenterPoints[i], validCenterPoints[j]] = [validCenterPoints[j], validCenterPoints[i]];
        }
        const pointsToTake = Math.min(4, validCenterPoints.length);
        for (let i = 0; i < pointsToTake; i++) {
          const center = validCenterPoints[i];
          squares.push({
            top: `${center.y - margin}px`,
            left: `${center.x - margin}px`,
          });
        }
      }
      while (squares.length < 4) {
        squares.push({
          top: `${Math.random() * (imageSize - squareSize)}px`,
          left: `${Math.random() * (imageSize - squareSize)}px`,
        });
      }

      const urls = [];
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = 100;
      cropCanvas.height = 100;
      const cropCtx = cropCanvas.getContext('2d');
      for (const square of squares) {
        cropCtx.clearRect(0, 0, 100, 100);
        const sx = parseInt(square.left, 10);
        const sy = parseInt(square.top, 10);
        cropCtx.drawImage(analysisCanvas, sx, sy, 20, 20, 0, 0, 100, 100);
        urls.push(cropCanvas.toDataURL());
      }
      
      setRandomSquares(squares);
      setCroppedImageUrls(urls);
    };

    img.onerror = () => {
      console.error("Failed to load image for canvas processing:", randomImageSrc);
      setRandomSquares([]);
      setCroppedImageUrls([]);
    }
  }, [isAllCardsDroppedPopupVisible, popupImages, currentPopupImageIndex]);

  // 선 좌표를 계산하는 useEffect
  useEffect(() => {
    if (isAllCardsDroppedPopupVisible && mainContentRef.current && randomSquares.length === 4 && croppedImageUrls.length === 4) {
      const calculateLines = () => {
        const wrapperRect = mainContentRef.current.getBoundingClientRect();
        const leftGrid = mainContentRef.current.children[0];
        const imageWrapper = mainContentRef.current.children[1];
        const rightGrid = mainContentRef.current.children[2];

        if (!leftGrid || !imageWrapper || !rightGrid) return;
        
        const imageWrapperRect = imageWrapper.getBoundingClientRect();
        
        const getRelativePos = (rect) => ({
            top: rect.top - wrapperRect.top,
            left: rect.left - wrapperRect.left,
        });

        const imageWrapperRelPos = getRelativePos(imageWrapperRect);
        
        const newLines = [];
        const squareSize = 20;
        const gridSize = 100;

        // 작은 사각형들과 큰 사각형(그리드 아이템)들을 1:1로 연결
        for (let i = 0; i < 4; i++) {
            const smallSquare = randomSquares[i];
            
            // 시작점(x1, y1): 작은 사각형의 중심
            const x1_center = imageWrapperRelPos.left + parseInt(smallSquare.left, 10) + (squareSize / 2);
            const y1_center = imageWrapperRelPos.top + parseInt(smallSquare.top, 10) + (squareSize / 2);

            // 끝점(x2, y2): 큰 사각형의 중심
            let gridItem, gridItemRect;
            if (i < 2) { // 왼쪽 그리드
                gridItem = leftGrid.children[i];
                if(gridItem) gridItemRect = gridItem.getBoundingClientRect();
            } else { // 오른쪽 그리드
                gridItem = rightGrid.children[i - 2];
                if(gridItem) gridItemRect = gridItem.getBoundingClientRect();
            }

            if (gridItemRect) {
                const gridItemRelPos = getRelativePos(gridItemRect);
                const x2_center = gridItemRelPos.left + (gridSize / 2);
                const y2_center = gridItemRelPos.top + (gridSize / 2);

                // --- Calculate intersection point for the LARGE square (endpoint) ---
                let x2 = x2_center;
                let y2 = y2_center;
                const dx_large = x1_center - x2_center;
                const dy_large = y1_center - y2_center;

                if (dx_large !== 0 || dy_large !== 0) {
                    const hw = gridSize / 2;
                    const hh = gridSize / 2;
                    if (Math.abs(dy_large * hw) < Math.abs(dx_large * hh)) {
                        const scale = hw / Math.abs(dx_large);
                        x2 = x2_center + dx_large * scale;
                        y2 = y2_center + dy_large * scale;
                    } else {
                        const scale = hh / Math.abs(dy_large);
                        x2 = x2_center + dx_large * scale;
                        y2 = y2_center + dy_large * scale;
                    }
                }

                // --- NEW: Calculate intersection point for the SMALL square (startpoint) ---
                let x1 = x1_center;
                let y1 = y1_center;
                const dx_small = x2 - x1_center;
                const dy_small = y2 - y1_center;

                if (dx_small !== 0 || dy_small !== 0) {
                    const hw = squareSize / 2;
                    const hh = squareSize / 2;
                    if (Math.abs(dy_small * hw) < Math.abs(dx_small * hh)) {
                        const scale = hw / Math.abs(dx_small);
                        x1 = x1_center + dx_small * scale;
                        y1 = y1_center + dy_small * scale;
                    } else {
                        const scale = hh / Math.abs(dy_small);
                        x1 = x1_center + dx_small * scale;
                        y1 = y1_center + dy_small * scale;
                    }
                }
                
                newLines.push({ x1, y1, x2, y2 });
            }
        }
        setLineCoordinates(newLines);
      };

      const timeoutId = setTimeout(calculateLines, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isAllCardsDroppedPopupVisible, randomSquares, croppedImageUrls]);

  // 3. 이미지 순환 및 페이지 이동 타이머
  useEffect(() => {
    if (!isAllCardsDroppedPopupVisible || popupImages.length === 0) return;

    const timer = setTimeout(() => {
      if (currentPopupImageIndex < popupImages.length - 1) {
        setCurrentPopupImageIndex(prevIndex => prevIndex + 1);
      } else {
        // 마지막 이미지 표시 후 /more 페이지로 이동
        const firstCardTitle = sortedDroppedCardNames.length > 0 ? sortedDroppedCardNames[0] : null;
        if (firstCardTitle) {
          const cardData = cards.find(c => c.title === firstCardTitle);
          if (cardData) {
            const cardTitle = cardData.title.replace(/[()]/g, '');
            const imageName = cardData.image.replace('/','').replace('.png','');
            const words = [cardTitle, imageName];
            const queryString = words.map(word => encodeURIComponent(word)).join(',');
            router.push(`/more?words=${queryString}`);
          }
        }
      }
    }, 2500); // 2.5초 딜레이

    return () => {
      clearTimeout(timer);
    };
  }, [isAllCardsDroppedPopupVisible, currentPopupImageIndex, popupImages, router, sortedDroppedCardNames, cards]);

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

  const currentImage = popupImages.length > 0 ? popupImages[currentPopupImageIndex] : '';
  const currentWord = currentImage 
    ? currentImage.split('/').pop().split('.').slice(0, -1).join('.')
    : '';

  // 카메라 준비 완료 시 호출될 콜백
  const handleCameraReady = () => {
    setAnimationPhase('header');
  };

  // 카드 시퀀스 완료 시 호출될 콜백
  const handleCardsComplete = () => {
    setAnimationPhase('complete');
  };

  // header -> cards 자동 전환 로직
  useEffect(() => {
    if (animationPhase === 'header') {
      const timer = setTimeout(() => {
        setAnimationPhase('cards');
      }, 1500); // 1.5초 후 카드 등장
      return () => clearTimeout(timer);
    }
  }, [animationPhase]);

  const handleMoreClick = () => {
    if (selectedProject) {
      // 프로젝트 제목과 이미지 이름을 사용하여 쿼리 생성
      const cardTitle = selectedProject.title.replace(/[()]/g, '');
      const imageName = selectedProject.image.replace('/','').replace('.png','');
      const words = [cardTitle, imageName];
      
      const queryString = words.map(word => encodeURIComponent(word)).join(',');
      router.push(`/more?words=${queryString}`);
    }
  };

  return (
    <Container className={spaceMono.className} ref={containerRef}>
      {/* 1. 그리드 애니메이션: 항상 렌더링 */}
      <GridReveal
        rows={6}
        cols={16}
        lineColor="#fff"
        bgColor="#111"
        lineWidth={0.3}
        animationDuration={1800}
        onComplete={() => {
          // 한 번만 실행되도록 보장
          if (animationPhase === 'grid') {
            setAnimationPhase('camera');
          }
        }}
      />

      {/* 2. 카메라 & 라벨 그룹: 그리드 이후 단계에서, 그리고 팝업이 보이지 않을 때만 보이게 */}
      {animationPhase !== 'grid' && !isAllCardsDroppedPopupVisible && (
        <WebcamWrapper>
          <WebcamContainer>
            {webcamError ? (
              <div>no cam</div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} />
              </>
            )}
          </WebcamContainer>
          {isClient && !webcamError && (
            <WebcamLabel>
              <div>user detected</div>
              <div>object: {detectedObjectName || '...'}</div>
            </WebcamLabel>
          )}
        </WebcamWrapper>
      )}

      {/* 3. 헤더 텍스트: 항상 공간을 차지하고, header 단계부터 fade-in */}
      <Header style={{
        opacity: ['header', 'cards', 'complete'].includes(animationPhase) ? 1 : 0,
        visibility: ['header', 'cards', 'complete'].includes(animationPhase) ? 'visible' : 'hidden',
        transition: 'opacity 0.8s ease-in-out'
      }}>
        <Title>Artifacts of Tomorrow</Title>
        <Subtitle>
          <Typewriter 
            text={SUBTITLE_TEXT}
            typingSpeed={30}
            sentencePause={500}
          />
        </Subtitle>
      </Header>

      {/* 4. 프로젝트 카드 순차 등장 */}
      {animationPhase === 'cards' && (
        <CardSequence
          isVisible={true}
          cards={cards}
          onComplete={handleCardsComplete}
        />
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

      {isClient && (
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

      <Section 
        ref={sectionRef}
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
                  e.preventDefault();
                  setMouseDownPos({ x: e.clientX, y: e.clientY });
                  handleMouseDown(e, project.id);
                }}
                onMouseUp={(e) => {
                  const dist = mouseDownPos ? Math.sqrt(Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2)) : 100;
                  if (dist < 10) {
                    handleCardClick(project);
                  }
                  handleMouseUp();
                }}
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

      {/* The popup is no longer needed as we navigate directly */}
      {/* <ProjectPopup
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onMore={handleMoreClick}
        project={selectedProject}
      /> */}

      {/* All Cards Dropped Popup */}
      {isAllCardsDroppedPopupVisible && (
        <AllCardsDroppedPopupOverlay>
          <AllCardsDroppedPopupContent>
            {popupImages.length > 0 && (
              <div className="main-content-wrapper" ref={mainContentRef}>
                {/* Left Grid */}
                <div className="grid-container">
                  {croppedImageUrls.slice(0, 2).map((url, index) => (
                    <div key={`left-crop-${index}`} className="grid-square">
                      <img src={url} alt={`Detail crop ${index + 1}`} />
                    </div>
                  ))}
                </div>

                {/* Center Image */}
                <div className="popup-image-wrapper">
                  <Image 
                    src={popupImages[currentPopupImageIndex]} 
                    alt="Randomly selected artifact" 
                    width={300} 
                    height={300}
                    className="popup-image"
                  />
                  {randomSquares.map((pos, index) => (
                    <div 
                      key={index}
                      className="random-square"
                      style={{ top: pos.top, left: pos.left }}
                    />
                  ))}
                </div>

                {/* Right Grid */}
                <div className="grid-container">
                  {croppedImageUrls.slice(2, 4).map((url, index) => (
                    <div key={`right-crop-${index}`} className="grid-square">
                      <img src={url} alt={`Detail crop ${index + 3}`} />
                    </div>
                  ))}
                </div>
                
                {/* SVG for drawing lines */}
                {lineCoordinates.length === 4 && (
                  <svg className="line-svg-overlay">
                    {lineCoordinates.map((line, index) => (
                      <line
                        key={`line-${index}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#FFF"
                        strokeWidth="0.5"
                      />
                    ))}
                  </svg>
                )}
              </div>
            )}
            <div className="words-container">
              {sortedDroppedCardNames.map((word, index) => (
                <span 
                  key={index}
                  className={`word-item ${word === currentWord ? 'highlight' : ''}`}
                >
                  {word}
                </span>
              ))}
            </div>
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