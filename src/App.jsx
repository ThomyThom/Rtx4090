import React, { useRef, useLayoutEffect, Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  ContactShadows, 
  Float, 
  Sparkles, 
  useProgress, 
  Html,
  PerspectiveCamera
} from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registra o plugin de Scroll
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. HOOK CUSTOMIZADO: RESPONSIVIDADE
// ==========================================
// Permite que o 3D e a interface se adaptem se o usuário estiver no celular ou desktop
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

// ==========================================
// 2. COMPONENTE: TELA DE CARREGAMENTO (LOADER)
// ==========================================
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader-container">
        <div className="loader-bar-bg">
          <div className="loader-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="loader-text">INICIANDO NÚCLEOS TENSOR... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// ==========================================
// 3. COMPONENTE 3D: A PLACA DE VÍDEO & COREOGRAFIA
// ==========================================
function GpuModel({ isMobile }) {
  // Carrega o modelo
  const { scene } = useGLTF('/geforce_rtx_4090_founders_edition.glb'); 
  
  // Referências para animação individual de posição e rotação
  const groupRef = useRef();
  const modelRef = useRef();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#main-scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2, // Suaviza o movimento preso ao scroll
        }
      });

      // Valores dinâmicos baseados no tamanho da tela
      const xOffset = isMobile ? 0 : 2.5;
      const baseScale = isMobile ? 0.008 : 0.012;

      // SET INICIAL (Hero Section)
      // Placa na diagonal, majestosa
      gsap.set(groupRef.current.position, { x: xOffset, y: -0.5, z: 0 });
      gsap.set(modelRef.current.rotation, { x: 0.3, y: -0.6, z: 0.1 });
      gsap.set(modelRef.current.scale, { x: baseScale, y: baseScale, z: baseScale });

      // ANIMAÇÃO 1: Para "Arquitetura Ada" (Move para a esquerda, mostra o perfil)
      tl.to(groupRef.current.position, { x: isMobile ? 0 : -xOffset, y: 0, z: 1, ease: "power1.inOut" }, 0);
      tl.to(modelRef.current.rotation, { x: 0.1, y: Math.PI / 4, z: -0.1, ease: "power1.inOut" }, 0);

      // ANIMAÇÃO 2: Para "Refrigeração" (Barrel roll dramático mostrando a parte de trás/fans)
      tl.to(groupRef.current.position, { x: isMobile ? 0 : xOffset * 0.8, y: -1, z: 0.5, ease: "power1.inOut" }, 1);
      tl.to(modelRef.current.rotation, { x: -0.2, y: Math.PI + 0.5, z: 0.2, ease: "power1.inOut" }, 1);

      // ANIMAÇÃO 3: Para "Ray Tracing" (Move centro, flutua em pé de frente)
      tl.to(groupRef.current.position, { x: 0, y: 0, z: 1.5, ease: "power1.inOut" }, 2);
      tl.to(modelRef.current.rotation, { x: 0, y: Math.PI * 2, z: 0, ease: "power1.inOut" }, 2);

      // ANIMAÇÃO 4: Para "CTA / Comprar" (Recua suavemente, corrige o erro de atravessar a câmera)
      tl.to(groupRef.current.position, { x: 0, y: -0.5, z: -1, ease: "power2.out" }, 3);
      tl.to(modelRef.current.rotation, { x: 0.15, y: Math.PI * 2.1, z: 0, ease: "power2.out" }, 3);

    });

    return () => ctx.revert(); // Cleanup do GSAP
  }, [isMobile]);

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.6}>
        {/* Usamos primitive para renderizar a malha carregada */}
        <primitive ref={modelRef} object={scene} />
      </Float>
    </group>
  );
}

// ==========================================
// 4. COMPONENTE PRINCIPAL: APP & UI TIMELINES
// ==========================================
export default function App() {
  const { isMobile } = useWindowSize();

  // Refs para a Interface HTML
  const section1Ref = useRef();
  const section2Ref = useRef();
  const section3Ref = useRef();
  const section4Ref = useRef();
  const section5Ref = useRef();
  const progressRef = useRef();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Animação da barra de progresso no topo da tela
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "#main-scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.1,
        }
      });

      // Animações dos Textos HTML (Surgem e desaparecem)
      const sections = [
        { ref: section1Ref, start: 0, end: 0.8 },
        { ref: section2Ref, start: 0.8, end: 1.8 },
        { ref: section3Ref, start: 1.8, end: 2.8 },
        { ref: section4Ref, start: 2.8, end: 3.8 },
        { ref: section5Ref, start: 3.8, end: 5.0 },
      ];

      // O GSAP Timeline principal do DOM
      const domTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#main-scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        }
      });

      // Lógica matemática para fazer as divs aparecerem na hora certa do scroll
      sections.forEach((sec, index) => {
        if (index !== 0) {
          // Surge de baixo com fade in
          domTl.fromTo(sec.ref.current, 
            { opacity: 0, y: 100, filter: "blur(10px)" }, 
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5 }, 
            sec.start
          );
        }
        if (index !== sections.length - 1) {
          // Some para cima com fade out
          domTl.to(sec.ref.current, 
            { opacity: 0, y: -100, filter: "blur(10px)", duration: 0.5 }, 
            sec.end
          );
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div id="main-scroll-container" className="main-wrapper">
      
      {/* ==========================================
          5. CSS INJETADO GIGANTE (OVERHAUL VISUAL)
          ========================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;400;700;900&display=swap');
        
        :root {
          --nvidia-green: #76b900;
          --bg-dark: #07070a;
          --text-main: #f0f0f0;
          --text-muted: #888890;
        }

        body, html { 
          margin: 0; padding: 0; 
          background-color: var(--bg-dark); 
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          overscroll-behavior: none;
        }

        /* Scrollbar Customizada */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: var(--nvidia-green); border-radius: 4px; }

        .main-wrapper {
          height: 500vh; /* 5 telas de altura para muito espaço de scroll */
          position: relative;
        }

        /* Barra de Progresso Leitura */
        .reading-progress {
          position: fixed; top: 0; left: 0; width: 100%; height: 4px;
          background: rgba(255,255,255,0.1); z-index: 100;
          transform-origin: 0% 50%; transform: scaleX(0);
        }
        .reading-progress-fill {
          width: 100%; height: 100%; background: var(--nvidia-green);
          box-shadow: 0 0 10px var(--nvidia-green);
        }

        /* Navbar Premium */
        .navbar {
          position: fixed; top: 0; left: 0; width: 100%;
          padding: 2rem 4rem; display: flex; justify-content: space-between;
          align-items: center; z-index: 50; box-sizing: border-box;
          background: linear-gradient(to bottom, rgba(7,7,10,0.8) 0%, transparent 100%);
          backdrop-filter: blur(4px); pointer-events: none;
        }
        .logo { font-weight: 900; font-size: 1.8rem; letter-spacing: -1px; pointer-events: auto; cursor: pointer; }
        .logo-dot { color: var(--nvidia-green); }
        .nav-links { display: flex; gap: 3rem; font-weight: 400; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; }
        
        /* Container do Canvas 3D */
        .canvas-container {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1;
        }

        /* Grid de Seções UI */
        .ui-layer {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 10; pointer-events: none; display: flex; align-items: center;
        }
        
        .section-content {
          padding: 0 10vw; width: 100%; box-sizing: border-box; display: flex;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px); border-radius: 24px; padding: 3rem;
          max-width: 550px; pointer-events: auto;
        }

        /* Tipografia */
        .tagline { color: var(--nvidia-green); font-weight: 700; letter-spacing: 4px; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 1rem; display: block; }
        h1 { font-size: clamp(3rem, 6vw, 5.5rem); font-weight: 900; line-height: 1; margin: 0 0 1.5rem 0; letter-spacing: -2px; }
        h2 { font-size: clamp(2rem, 4vw, 4rem); font-weight: 800; line-height: 1.1; margin: 0 0 1rem 0; letter-spacing: -1px; }
        p { font-size: 1.15rem; color: var(--text-muted); line-height: 1.6; font-weight: 200; margin: 0; }
        
        .highlight { color: #fff; font-weight: 400; }
        .text-green { color: var(--nvidia-green); text-shadow: 0 0 30px rgba(118,185,0,0.4); }

        /* Grade de Specs */
        .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
        .spec-item { border-left: 2px solid var(--nvidia-green); padding-left: 1rem; }
        .spec-value { font-size: 2rem; font-weight: 700; color: #fff; display: block; }
        .spec-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

        /* Botão Premium */
        .btn-primary {
          background: var(--nvidia-green); color: #000; border: none;
          padding: 1.2rem 3rem; font-size: 1rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 2px; border-radius: 50px; cursor: pointer; transition: all 0.3s ease;
          margin-top: 2.5rem; display: inline-block; box-shadow: 0 10px 30px rgba(118,185,0,0.2);
        }
        .btn-primary:hover {
          background: #8deb00; transform: translateY(-5px); box-shadow: 0 15px 40px rgba(118,185,0,0.4);
        }

        /* Estilos do Loader */
        .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-dark); width: 100vw; height: 100vh; position: absolute; top: -50vh; left: -50vw; z-index: 9999; }
        .loader-bar-bg { width: 300px; height: 2px; background: rgba(255,255,255,0.1); margin-bottom: 20px; overflow: hidden; }
        .loader-bar-fill { height: 100%; background: var(--nvidia-green); transition: width 0.1s ease; box-shadow: 0 0 15px var(--nvidia-green); }
        .loader-text { color: var(--nvidia-green); font-family: monospace; font-size: 0.8rem; letter-spacing: 2px; }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .navbar { padding: 1.5rem; }
          .section-content { padding: 0 1.5rem; justify-content: center; text-align: center; }
          .glass-panel { padding: 2rem; background: rgba(0,0,0,0.4); }
          .specs-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ==========================================
          6. INTERFACE FIXA (Navbar e Progress)
          ========================================== */}
      <div className="reading-progress" ref={progressRef}>
        <div className="reading-progress-fill"></div>
      </div>

      <nav className="navbar">
        <div className="logo">GEFORCE<span className="logo-dot">.</span></div>
        <div className="nav-links">
          <span>Visão Geral</span>
          <span>Desempenho</span>
          <span>Specs</span>
        </div>
      </nav>

      {/* ==========================================
          7. O PALCO 3D (CANVAS)
          ========================================== */}
      <div className="canvas-container">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={isMobile ? 60 : 45} />
          
          {/* Iluminação Complexa e Realista */}
          <Environment preset="night" />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" castShadow />
          <directionalLight position={[-10, -20, -10]} intensity={1} color="#76b900" />
          
          {/* Luzes de Spot focadas para criar brilho no metal */}
          <spotLight position={[0, 5, 5]} angle={0.3} penumbra={0.8} intensity={5} color="#ffffff" />
          <spotLight position={[5, 0, -5]} angle={0.5} penumbra={1} intensity={10} color="#76b900" />

          {/* Partículas flutuantes (Poeira estelar / Cyber) */}
          <Sparkles count={isMobile ? 100 : 300} scale={15} size={1.5} speed={0.3} opacity={0.4} color="#76b900" />
          
          {/* Sombra de contato profunda */}
          <ContactShadows position={[0, -2.5, 0]} opacity={0.7} scale={20} blur={2.5} far={4} color="#000000" />

          {/* Carrega o modelo com fallback para o nosso Loader Customizado */}
          <Suspense fallback={<Loader />}>
            <GpuModel isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </div>

      {/* ==========================================
          8. SEÇÕES HTML DINÂMICAS (Animadas pelo GSAP)
          ========================================== */}
      
      {/* SEÇÃO 1: HERO */}
      <div className="ui-layer" ref={section1Ref}>
        <div className="section-content" style={{ justifyContent: 'flex-start' }}>
          <div className="glass-panel">
            <span className="tagline">Arquitetura Ada Lovelace</span>
            <h1>A Placa <br/>Definitiva.</h1>
            <p>Prepare-se para o ápice do design térmico e da potência gráfica. A <span className="highlight">GeForce RTX™ 4090</span> muda as regras do jogo e da criação de conteúdo para sempre.</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: DESEMPENHO (Esquerda) */}
      <div className="ui-layer" ref={section2Ref} style={{ opacity: 0 }}>
        <div className="section-content" style={{ justifyContent: 'flex-end', textAlign: isMobile ? 'center' : 'right' }}>
          <div className="glass-panel" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <span className="tagline">Força Bruta</span>
            <h2>O Dobro de <br/><span className="text-green">Performance.</span></h2>
            <p>Novos multiprocessadores de streaming e núcleos Tensor de 4ª geração garantem um salto quântico em IA e renderização.</p>
            <div className="specs-grid" style={{ textAlign: 'left' }}>
              <div className="spec-item">
                <span className="spec-value">24<span style={{ fontSize: '1rem' }}>GB</span></span>
                <span className="spec-label">GDDR6X VRAM</span>
              </div>
              <div className="spec-item">
                <span className="spec-value">16384</span>
                <span className="spec-label">NVIDIA CUDA® Cores</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: REFRIGERAÇÃO (Direita) */}
      <div className="ui-layer" ref={section3Ref} style={{ opacity: 0 }}>
        <div className="section-content" style={{ justifyContent: 'flex-start' }}>
          <div className="glass-panel">
            <span className="tagline">Engenharia Térmica</span>
            <h2>Frio. Silencioso.<br/>Implacável.</h2>
            <p>Ventoinhas duplas de fluxo axial maiores e uma câmara de vapor redesenhada. Aumentamos o fluxo de ar em 20% para manter o poder máximo em silêncio absoluto, mesmo sob carga extrema.</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: RAY TRACING (Centro) */}
      <div className="ui-layer" ref={section4Ref} style={{ opacity: 0 }}>
        <div className="section-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="glass-panel" style={{ maxWidth: '800px', background: 'radial-gradient(circle, rgba(118,185,0,0.1) 0%, transparent 70%)', border: 'none' }}>
            <span className="tagline">Hyper-Realismo</span>
            <h2 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>Ray Tracing.</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto' }}>A arquitetura Ada libera toda a glória do Ray Tracing, simulando o comportamento da luz no mundo real. Experimente mundos virtuais com detalhes sem precedentes.</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: COMPRAR / FINAL (Centro) */}
      <div className="ui-layer" ref={section5Ref} style={{ opacity: 0 }}>
        <div className="section-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', marginBottom: 0, textShadow: '0 20px 50px rgba(0,0,0,0.9)' }}>
              RTX <span className="text-green">4090</span>
            </h1>
            <p style={{ fontSize: '1.5rem', color: '#fff', marginTop: '1rem', fontWeight: 400 }}>O Futuro já está renderizado.</p>
            <button className="btn-primary">Garantir a Minha</button>
          </div>
        </div>
      </div>

    </div>
  );
}