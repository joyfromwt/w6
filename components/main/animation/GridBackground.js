import React from 'react';
import styled from 'styled-components';
import { ANIMATION_DURATIONS } from '../../../constants/animation';

const GridContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size: 150px 150px;
  opacity: 0;
  transform: scale(1.02);
  transition: opacity ${ANIMATION_DURATIONS.GRID_FADE}ms ease-in-out, transform ${ANIMATION_DURATIONS.GRID_FADE}ms cubic-bezier(0.4,0,0.2,1);
  z-index: 0;

  &.visible {
    opacity: 1;
    transform: scale(1);
  }
`;

const GridBackground = ({ isVisible }) => {
  return (
    <GridContainer className={isVisible ? 'visible' : ''} />
  );
};

export default React.memo(GridBackground); 