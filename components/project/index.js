import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ErikaMonoFont,
  Container,
  Content,
  Header,
  Title,
  Subtitle,
  ImageContainer,
  InfoSection,
  InfoTitle,
  TechStack,
  TechTag,
  BackButton,
  RulerContainer,
  RulerTick,
  RulerLabel
} from './styles';

const ProjectDetail = ({ project }) => {
  const containerRef = useRef(null);
  const [rulerTicks, setRulerTicks] = useState([]);

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

  if (!project) return null;

  return (
    <Container ref={containerRef}>
      <ErikaMonoFont />
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

      <Content>
        <Header>
          <Title>{project.title}</Title>
          <Subtitle>{project.description}</Subtitle>
        </Header>

        <ImageContainer>
          {project.image && (
            <Image
              src={project.image}
              alt={project.title}
              layout="fill"
              objectFit="cover"
              quality={100}
            />
          )}
        </ImageContainer>

        <InfoSection>
          <InfoTitle>Overview</InfoTitle>
          <Subtitle>{project.overview}</Subtitle>
        </InfoSection>

        <InfoSection>
          <InfoTitle>Technical Stack</InfoTitle>
          <TechStack>
            {project.technologies?.map((tech, index) => (
              <TechTag key={index}>{tech}</TechTag>
            ))}
          </TechStack>
        </InfoSection>

        {project.demoUrl && (
          <InfoSection>
            <InfoTitle>Live Demo</InfoTitle>
            <Link href={project.demoUrl} passHref>
              <BackButton target="_blank" rel="noopener noreferrer">
                View Demo
              </BackButton>
            </Link>
          </InfoSection>
        )}

        <Link href="/" passHref>
          <BackButton>Back to Projects</BackButton>
        </Link>
      </Content>
    </Container>
  );
};

export default ProjectDetail; 