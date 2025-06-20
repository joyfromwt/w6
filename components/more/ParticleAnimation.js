import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

// --- 추가된 부분: 텍스처 아틀라스 생성 함수 ---
// *, 0, 1 텍스트로 텍스처 아틀라스를 생성하여 반환합니다.
// 폰트 스타일을 통해 cyber-retro aesthetic을 표현합니다.
const createTextTextureAtlas = () => {
    const chars = ['*', '0', '1'];
    const canvas = document.createElement('canvas');
    const size = 128; // 텍스처 해상도를 높여 화질 개선
    canvas.width = size * chars.length;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.9}px monospace`; // low-res 느낌의 폰트
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    chars.forEach((char, i) => {
        ctx.fillText(char, (i * size) + (size / 2), size / 2);
    });

    return new THREE.CanvasTexture(canvas);
};

const ParticleAnimation = ({ modelFile, transitionValue }) => {
  const mountRef = useRef(null);
  const wrapperRef = useRef(null);
  const particlesRef = useRef(null);
  const solidModelRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- 기본 Three.js 설정 ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 15; // 파티클에 맞게 카메라 거리 조정

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    
    const mouse = new THREE.Vector2(0, 0);

    // Wrapper group to hold both models
    const wrapper = new THREE.Group();
    scene.add(wrapper);
    wrapperRef.current = wrapper;

    // --- 추가된 부분: 셰이더 코드 ---
    const vertexShader = `
      // 각 파티클에 할당된 텍스처 인덱스(0, 1, 2)
      attribute float textureIndex;
      // 프래그먼트 셰이더로 인덱스 전달을 위한 변수
      varying float vTextureIndex;

      void main() {
        vTextureIndex = textureIndex;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // 텍스트 파티클의 크기 설정
        gl_PointSize = 15.0; 
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      // 텍스처 아틀라스 유니폼
      uniform sampler2D atlasTexture;
      uniform float opacity;
      // 버텍스 셰이더에서 전달받은 텍스처 인덱스
      varying float vTextureIndex;

      void main() {
        // vTextureIndex (0, 1, 2)에 따라 텍스처 아틀라스의 UV 좌표를 계산합니다.
        // 텍스처는 3개이므로, 각 텍스처는 U 좌표의 1/3을 차지합니다.
        float u_offset = floor(vTextureIndex) / 3.0;
        vec2 uv = vec2((gl_PointCoord.x / 3.0) + u_offset, gl_PointCoord.y);
        
        vec4 color = texture2D(atlasTexture, uv);

        // 텍스트 주변의 투명한 배경은 그리지 않도록 폐기(discard)합니다.
        if (color.a < 0.1) discard;
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `;

    // --- GLTF 로더 ---
    const loader = new GLTFLoader();
    loader.load(
      modelFile || '/Phone.glb', // prop으로 받은 모델 파일 사용, 없으면 기본값
      (gltf) => {
        const originalModel = gltf.scene;
        const solidModel = originalModel.clone();
        solidModelRef.current = solidModel;

        const vertices = [];
        
        // Sample particles from original model
        originalModel.traverse((child) => {
          if (child.isMesh) {
            const sampler = new MeshSurfaceSampler(child).build();
            const particleCount = child.geometry.attributes.position.count * 8;
            child.updateWorldMatrix(true, false);
            for (let i = 0; i < particleCount; i++) {
                const samplePosition = new THREE.Vector3();
                sampler.sample(samplePosition);
                samplePosition.applyMatrix4(child.matrixWorld);
                vertices.push(samplePosition.x, samplePosition.y, samplePosition.z);
            }
          }
        });

        // Setup solid model material
        solidModel.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.5,
              metalness: 0.5,
              transparent: true,
              opacity: 0
            });
          }
        });
        
        // Setup particle geometry
        const geometry = new THREE.BufferGeometry();
        if (vertices.length > 0) {
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const numParticles = vertices.length / 3;
            const textureIndices = new Float32Array(numParticles);
            for (let i = 0; i < numParticles; i++) {
                textureIndices[i] = Math.floor(Math.random() * 3);
            }
            geometry.setAttribute('textureIndex', new THREE.BufferAttribute(textureIndices, 1));
        }
        
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: { 
              atlasTexture: { value: createTextTextureAtlas() },
              opacity: { value: 1.0 }
            },
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
        });

        const particles = new THREE.Points(geometry, particleMaterial);
        particlesRef.current = particles;

        // Add both to the wrapper
        wrapper.add(particles);
        wrapper.add(solidModel);

        // Center and scale the wrapper
        const box = new THREE.Box3().setFromObject(wrapper);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 15 / maxDim;

        wrapper.position.sub(center);
        wrapper.position.y -= 3;
        wrapper.scale.setScalar(scale);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
      },
      undefined,
      (error) => {
        console.error('An error happened while loading the model:', error);
      }
    );
    
    // --- 이벤트 리스너 ---
    const onMouseMove = (event) => {
      if (!mount) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onWindowResize = () => {
      if(mount) {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      }
    };
    window.addEventListener('resize', onWindowResize);

    // --- 애니메이션 루프 ---
    const animate = () => {
      requestAnimationFrame(animate);
      const currentWrapper = wrapperRef.current;
      if (currentWrapper) {
        currentWrapper.rotation.y += (mouse.x * 0.2 - currentWrapper.rotation.y) * 0.05;
        currentWrapper.rotation.x += (-mouse.y * 0.2 - currentWrapper.rotation.x) * 0.05;
      }
      renderer.render(scene, camera);
    };
    animate();

    // --- 클린업 ---
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [modelFile]); // useEffect가 modelFile prop의 변경에 반응하도록 의존성 배열에 추가

  // --- 추가된 부분: transitionValue 변경에 따른 투명도 조절 ---
  useEffect(() => {
    const particles = particlesRef.current;
    const solidModel = solidModelRef.current;

    if (particles && solidModel) {
      particles.material.uniforms.opacity.value = 1.0 - transitionValue;

      solidModel.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = transitionValue;
        }
      });
    }
  }, [transitionValue]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ParticleAnimation; 