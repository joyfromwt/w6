import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

const defaultOptions = {
  rows: 10,
  cols: 16,
  lineColor: '#fff',
  bgColor: '#111',
  lineWidth: 2,
  animationDuration: 1400,
  triggerOnView: false,
};

function cubicEase(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const GridReveal = forwardRef((props, ref) => {
  const options = { ...defaultOptions, ...props };
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const startTimeRef = useRef();
  const gridRef = useRef();
  const [isComplete, setIsComplete] = useState(false);

  const computeGrid = (width, height) => {
    const numRows = options.rows;

    // 화면 비율에 맞춰 'cols'를 동적으로 계산하여 정사각형 격자 생성
    // options.cols 값은 무시됩니다.
    const aspectRatio = width / height;
    const numCols = Math.round(aspectRatio * (numRows + 1)) - 1;

    return {
      hLines: Array.from({ length: numRows }, (_, i) => (i + 1) * (height / (numRows + 1))),
      vLines: Array.from({ length: numCols }, (_, i) => (i + 1) * (width / (numCols + 1))),
    };
  };

  const drawGrid = (progress) => {
    const canvas = canvasRef.current;
    if (!canvas || !gridRef.current) return;
    const ctx = canvas.getContext('2d');
    const ease = cubicEase(progress);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    ctx.strokeStyle = options.lineColor;
    ctx.lineWidth = options.lineWidth * dpr;

    for (const y of gridRef.current.hLines) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / 2 - (canvas.width / 2) * (1 - ease), y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(canvas.width, y);
      ctx.lineTo(canvas.width / 2 + (canvas.width / 2) * (1 - ease), y);
      ctx.stroke();
    }
    for (const x of gridRef.current.vLines) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / 2 - (canvas.height / 2) * (1 - ease));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x, canvas.height / 2 + (canvas.height / 2) * (1 - ease));
      ctx.stroke();
    }
  };

  const animate = (ts) => {
    if (!startTimeRef.current) startTimeRef.current = ts;
    const elapsed = ts - startTimeRef.current;
    const t = Math.min(elapsed / options.animationDuration, 1);

    drawGrid(t);

    if (t < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (!isComplete) {
        setIsComplete(true);
        options.onComplete?.();
      }
    }
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    gridRef.current = computeGrid(canvas.width, canvas.height);

    if (isComplete) {
      drawGrid(1);
    } else if (startTimeRef.current) {
      const elapsed = performance.now() - startTimeRef.current;
      const t = Math.min(elapsed / options.animationDuration, 1);
      drawGrid(t);
    } else {
      drawGrid(0);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const trigger = () => {
    startTimeRef.current = null;
    animationRef.current && cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (options.triggerOnView) {
      const observer = new window.IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            trigger();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(canvasRef.current);
      return () => observer.disconnect();
    } else {
      trigger();
    }
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      animationRef.current && cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    trigger,
  }));

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '150vw',
        height: '150vh',
        display: 'block',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      className="grid-reveal-canvas"
    />
  );
});

export default GridReveal; 