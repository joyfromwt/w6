// 애니메이션 딜레이 (ms)
export const ANIMATION_DELAYS = {
  GRID_FADE_IN: 500,      // 격자 배경 페이드인 시작 시간
  HEADER_START: 1000,     // 헤더 애니메이션 시작 시간
  CARD_INTERVAL: 300,     // 카드 간 등장 간격
  CARD_START: 2000,       // 카드 애니메이션 시작 시간
};

// 애니메이션 지속 시간 (ms)
export const ANIMATION_DURATIONS = {
  GRID_FADE: 800,         // 격자 배경 페이드인/아웃 시간
  HEADER_TYPING: 2000,    // 헤더 타이핑 애니메이션 시간
  CARD_FADE: 500,         // 카드 페이드인/아웃 시간
};

// 애니메이션 단계
export const ANIMATION_PHASES = {
  INITIAL: 'initial',     // 초기 상태
  GRID: 'grid',          // 격자 배경 표시
  HEADER: 'header',      // 헤더 애니메이션
  CARDS: 'cards',        // 카드 애니메이션
  COMPLETE: 'complete'   // 모든 애니메이션 완료
}; 