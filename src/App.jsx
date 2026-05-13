import React, { useRef, useLayoutEffect, useEffect, useState, Suspense, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  ContactShadows, 
  Float, 
  Sparkles, 
  useProgress, 
  Html,
  PerspectiveCamera,
  Stats
} from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registra o plugin do GSAP
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. CONTEXT API: GERENCIAMENTO DE ESTADO GLOBAL
// ==========================================
// Permite que qualquer componente (HTML ou 3D) saiba qual é a cor do tema atual
const ThemeContext = createContext();

const themes = {
  nvidia: { color: '#76b900', name: 'NVIDIA Green' },
  studio: { color: '#ffffff', name: 'Creator White' },
  cyber:  { color: '#ff0055', name: 'Cyberpunk Pink' }
};

// ==========================================
// 2. HOOKS CUSTOMIZADOS (ARQUITETURA SÊNIOR)
// ==========================================

// Hook para Responsividade Perfeita (Evita linhas verticais e quebras)
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

// Hook para capturar o mouse (usado no Parallax 3D e Cursor)
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e) => {
      // Normaliza a posição do mouse de -1 a 1 para cálculos 3D precisos
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 2 - 1, 
        y: -(e.clientY / window.innerHeight) * 2 + 1 
      });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return mousePosition;
}

// ==========================================
// 3. COMPONENTES UI: CURSOR E LOADER
// ==========================================

function CustomCursor() {
  const cursorRef = useRef();
  
  useEffect(() => {
    const moveCursor = (e) => {
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.2,
        ease: "power2.out"
      });
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <div 
      ref={cursorRef} 
      className="custom-cursor"
      style={{
        position: 'fixed', top: -10, left: -10, width: 20, height: 20,
        borderRadius: '50%', border: '2px solid var(--theme-color)',
        pointerEvents: 'none', zIndex: 9999, mixBlendMode: 'difference',
        transform: 'translate(-50%, -50%)'
      }}
    />
  );
}

function Loader() {
  const { progress } = useProgress();
  const { currentTheme } = useContext(ThemeContext);
  
  return (
    <Html center>
      <div className="loader-container">
        <div className="loader-glitch" data-text="RTX_4090">RTX_4090</div>
        <div className="loader-bar-bg">
          <div 
            className="loader-bar-fill" 
            style={{ width: `${progress}%`, backgroundColor: currentTheme.color, boxShadow: `0 0 15px ${currentTheme.color}` }}
          />
        </div>
        <p className="loader-text" style={{ color: currentTheme.color }}>
          Sincronizando Núcleos Tensor... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
}

// ==========================================
// 4. COMPONENTE 3D: GPU COM PARALLAX E COREOGRAFIA
// ==========================================

function GpuModel({ isMobile }) {
  const { scene } = useGLTF('/geforce_rtx_4090_founders_edition.glb'); 
  const { currentTheme } = useContext(ThemeContext);
  
  // Referências independentes para evitar conflito entre o GSAP (Scroll) e o R3F (Mouse Parallax)
  const scrollGroupRef = useRef();
  const parallaxGroupRef = useRef();
  
  const mouse = useMousePosition();

  // Loop de Animação de Alta Performance (60fps) para o Parallax do Mouse
  useFrame(() => {
    if (!isMobile && parallaxGroupRef.current) {
      // Interpolação linear suave (Lerp) para a placa seguir o mouse com "peso"
      const targetX = mouse.x * 0.15;
      const targetY = mouse.y * 0.15;
      
      parallaxGroupRef.current.rotation.x += (targetY - parallaxGroupRef.current.rotation.x) * 0.05;
      parallaxGroupRef.current.rotation.y += (targetX - parallaxGroupRef.current.rotation.y) * 0.05;
    }
  });

  // Coreografia do GSAP (Atrelada ao Scroll)
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#main-scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        }
      });

      const xOffset = isMobile ? 0 : 2.5;
      const baseScale = isMobile ? 0.009 : 0.013;

      // Estado 0: Hero (Diagonal)
      gsap.set(scrollGroupRef.current.position, { x: xOffset, y: -0.5, z: 0 });
      gsap.set(scrollGroupRef.current.rotation, { x: 0.3, y: -0.6, z: 0.1 });
      gsap.set(scrollGroupRef.current.scale, { x: baseScale, y: baseScale, z: baseScale });

      // Estado 1: Desempenho (Vai para a esquerda, mostra o chip lateral)
      tl.to(scrollGroupRef.current.position, { x: isMobile ? 0 : -xOffset, y: 0.2, z: 1, ease: "power2.inOut" }, 0);
      tl.to(scrollGroupRef.current.rotation, { x: 0.1, y: Math.PI / 5, z: -0.1, ease: "power2.inOut" }, 0);

      // Estado 2: Refrigeração (Barrel roll dramático mostrando os fans nas costas)
      tl.to(scrollGroupRef.current.position, { x: isMobile ? 0 : xOffset * 0.9, y: -0.5, z: 0.5, ease: "power2.inOut" }, 1);
      tl.to(scrollGroupRef.current.rotation, { x: -0.3, y: Math.PI + 0.6, z: 0.2, ease: "power2.inOut" }, 1);

      // Estado 3: Specs/Ray Tracing (Centraliza e flutua majestosamente)
      tl.to(scrollGroupRef.current.position, { x: 0, y: 0, z: 1.5, ease: "power3.inOut" }, 2);
      tl.to(scrollGroupRef.current.rotation, { x: 0, y: Math.PI * 2, z: 0, ease: "power3.inOut" }, 2);

      // Estado 4: CTA / Comprar (Aproxima levemente para impacto final)
      tl.to(scrollGroupRef.current.position, { x: 0, y: -0.8, z: 2.5, ease: "power1.out" }, 3);
      tl.to(scrollGroupRef.current.rotation, { x: 0.2, y: Math.PI * 2.15, z: 0, ease: "power1.out" }, 3);

    });
    return () => ctx.revert();
  }, [isMobile]);

  return (
    // scrollGroupRef sofre mutação pelo GSAP
    <group ref={scrollGroupRef}>
      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.8}>
        {/* parallaxGroupRef sofre mutação pelo mouse, mantendo os movimentos independentes e fluidos */}
        <group ref={parallaxGroupRef}>
          <primitive object={scene} />
        </group>
      </Float>
    </group>
  );
}

// ==========================================
// 5. COMPONENTES DE ILUMINAÇÃO (Reativos ao Tema)
// ==========================================

function SceneLighting({ isMobile }) {
  const { currentTheme } = useContext(ThemeContext);
  
  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.15} />
      
      {/* Luz Branca Principal (Corta de cima) */}
      <directionalLight position={[10, 20, 10]} intensity={2.5} color="#ffffff" castShadow />
      
      {/* Luz Temática Principal (Muda de cor conforme o UI) */}
      <spotLight 
        position={[-5, -10, -5]} 
        angle={0.8} 
        penumbra={1} 
        intensity={8} 
        color={currentTheme.color} 
      />
      
      {/* Luz de Preenchimento Temática (Spotlight focado) */}
      <spotLight 
        position={[5, 0, -5]} 
        angle={0.5} 
        penumbra={1} 
        intensity={12} 
        color={currentTheme.color} 
      />

      {/* Partículas Temáticas Flutuantes */}
      <Sparkles 
        count={isMobile ? 80 : 250} 
        scale={18} 
        size={1.5} 
        speed={0.4} 
        opacity={0.5} 
        color={currentTheme.color} 
      />
      
      <ContactShadows 
        position={[0, -3, 0]} 
        opacity={0.85} 
        scale={25} 
        blur={3} 
        far={5} 
        color="#000000" 
      />
    </>
  );
}

// ==========================================
// 6. COMPONENTES HTML: INTERFACE, NAVEGAÇÃO E SEÇÕES
// ==========================================

function NavBar({ currentTheme }) {
  // Função para rolagem suave ao clicar nos links (Navegação Funcional)
  const scrollToSection = (vhMultiplier) => {
    const targetY = window.innerHeight * vhMultiplier;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => scrollToSection(0)}>
        GEFORCE<span className="logo-dot" style={{ color: currentTheme.color }}>.</span>
      </div>
      <div className="nav-links">
        {/* Multiplicadores correspondem às 'telas' (0 = Hero, 1 = Desempenho, 2 = Refrigeração, 3 = Specs) */}
        <span onClick={() => scrollToSection(0)}>Visão Geral</span>
        <span onClick={() => scrollToSection(1)}>Desempenho</span>
        <span onClick={() => scrollToSection(2)}>Engenharia</span>
        <span onClick={() => scrollToSection(3)}>Especificações</span>
      </div>
    </nav>
  );
}

function ThemeController() {
  const { currentTheme, setCurrentTheme } = useContext(ThemeContext);

  return (
    <div className="theme-controller">
      <span className="theme-label">Iluminação</span>
      <div className="theme-buttons">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            className={`theme-btn ${currentTheme.name === theme.name ? 'active' : ''}`}
            style={{ backgroundColor: theme.color }}
            onClick={() => setCurrentTheme(theme)}
            title={theme.name}
          />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 7. APLICAÇÃO PRINCIPAL: O CÉREBRO DA PÁGINA
// ==========================================

export default function App() {
  // Estado Global do Tema (NVIDIA Green por padrão)
  const [currentTheme, setCurrentTheme] = useState(themes.nvidia);
  const { isMobile, height } = useWindowSize();

  // Refs das Seções HTML para Animação do GSAP
  const sectionRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const progressRef = useRef();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // 1. Barra de Progresso Superior
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

      // 2. Animação de Entrada e Saída das Seções HTML (Fade + Blur)
      const domTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#main-scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        }
      });

      // Timings matemáticos para cada uma das 5 seções
      const timings = [
        { start: 0, end: 0.8 },
        { start: 0.8, end: 1.8 },
        { start: 1.8, end: 2.8 },
        { start: 2.8, end: 3.8 },
        { start: 3.8, end: 5.0 },
      ];

      sectionRefs.forEach((sec, index) => {
        if (!sec.current) return;
        
        // Se não for a primeira seção, ela precisa entrar na tela
        if (index !== 0) {
          domTl.fromTo(sec.current, 
            { opacity: 0, y: 150, filter: "blur(15px)" }, 
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5 }, 
            timings[index].start
          );
        }
        // Se não for a última seção, ela precisa sair da tela
        if (index !== sectionRefs.length - 1) {
          domTl.to(sec.current, 
            { opacity: 0, y: -150, filter: "blur(15px)", duration: 0.5 }, 
            timings[index].end
          );
        }
      });
    });

    return () => ctx.revert();
  }, [height]); // Re-calcula se a tela mudar de tamanho drasticamente

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme }}>
      {/* Container Principal. Removido '100vw' e 'overflow-x' arriscados para evitar linhas verticais */}
      <div id="main-scroll-container" className="main-wrapper" style={{ '--theme-color': currentTheme.color }}>
        
        {!isMobile && <CustomCursor />}

        {/* ==========================================
            8. CSS INJETADO (OVERHAUL VISUAL MASSIVO)
            ========================================== */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;800;900&display=swap');
          
          :root {
            --bg-dark: #030305;
            --text-main: #f0f0f0;
            --text-muted: #888890;
            --glass-bg: rgba(10, 10, 15, 0.4);
            --glass-border: rgba(255, 255, 255, 0.05);
          }

          /* CSS RESET AGRESSIVO PARA MATAR AS LINHAS VERTICAIS */
          *, *::before, *::after { box-sizing: border-box; }
          body, html { 
            margin: 0; padding: 0; width: 100%; height: 100%;
            background-color: var(--bg-dark); color: var(--text-main);
            font-family: 'Inter', sans-serif;
            overflow-x: hidden; /* Garante que não haja quebra lateral */
            -webkit-font-smoothing: antialiased;
          }

          /* Scrollbar Estilizada Reativa ao Tema */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: var(--bg-dark); }
          ::-webkit-scrollbar-thumb { background: var(--theme-color); border-radius: 10px; transition: background 0.3s; }

          .main-wrapper {
            height: 500vh; /* 5 telas de altura */
            width: 100%;
            position: relative;
          }

          /* Elementos UI Fixos */
          .reading-progress {
            position: fixed; top: 0; left: 0; width: 100%; height: 3px;
            background: rgba(255,255,255,0.05); z-index: 100;
            transform-origin: 0% 50%; transform: scaleX(0);
          }
          .reading-progress-fill {
            width: 100%; height: 100%; background: var(--theme-color);
            box-shadow: 0 0 15px var(--theme-color); transition: background 0.5s ease;
          }

          .navbar {
            position: fixed; top: 0; left: 0; width: 100%;
            padding: 2rem 5%; display: flex; justify-content: space-between;
            align-items: center; z-index: 50; 
            background: linear-gradient(to bottom, rgba(3,3,5,0.9) 0%, transparent 100%);
            pointer-events: none;
          }
          .logo { font-weight: 900; font-size: 1.8rem; letter-spacing: -1px; pointer-events: auto; cursor: pointer; transition: transform 0.3s; }
          .logo:hover { transform: scale(1.05); }
          .logo-dot { transition: color 0.5s ease; }
          
          .nav-links { display: flex; gap: 3rem; pointer-events: auto; }
          .nav-links span { 
            font-weight: 600; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; 
            color: var(--text-muted); cursor: pointer; transition: all 0.3s ease; position: relative;
          }
          .nav-links span:hover { color: #fff; }
          .nav-links span::after {
            content: ''; position: absolute; width: 0%; height: 2px; bottom: -5px; left: 0;
            background-color: var(--theme-color); transition: all 0.3s ease;
          }
          .nav-links span:hover::after { width: 100%; }

          /* Controlador de Tema */
          .theme-controller {
            position: fixed; bottom: 40px; left: 5%; z-index: 50;
            background: var(--glass-bg); backdrop-filter: blur(10px);
            padding: 15px 25px; border-radius: 50px; border: 1px solid var(--glass-border);
            display: flex; align-items: center; gap: 15px; pointer-events: auto;
          }
          .theme-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); font-weight: 600; }
          .theme-buttons { display: flex; gap: 10px; }
          .theme-btn {
            width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent;
            cursor: pointer; transition: all 0.3s ease; outline: none; padding: 0;
          }
          .theme-btn:hover { transform: scale(1.2); }
          .theme-btn.active { border-color: #fff; transform: scale(1.2); box-shadow: 0 0 10px rgba(255,255,255,0.5); }

          /* Container 3D */
          .canvas-container {
            position: fixed; top: 0; left: 0; width: 100%; height: 100vh; z-index: 1;
            /* Remove qualquer pointer event do fundo para não atrapalhar o scroll */
            pointer-events: none; 
          }

          /* Estrutura das Seções HTML */
          .ui-layer {
            position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
            z-index: 10; pointer-events: none; display: flex; align-items: center;
          }
          
          .section-content { padding: 0 10%; width: 100%; display: flex; }

          /* Painel de Vidro Moderno (Glassmorphism Awwwards Style) */
          .glass-panel {
            background: var(--glass-bg); border: 1px solid var(--glass-border);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-radius: 30px; padding: 3.5rem; max-width: 600px; 
            pointer-events: auto; transition: border-color 0.5s ease;
          }
          .glass-panel:hover { border-color: rgba(255,255,255,0.15); }

          /* Tipografia e Estilos Locais */
          .tagline { 
            color: var(--theme-color); font-weight: 800; letter-spacing: 5px; 
            font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1.5rem; 
            display: inline-block; transition: color 0.5s ease;
          }
          h1 { font-size: clamp(3.5rem, 7vw, 6rem); font-weight: 900; line-height: 1.05; margin: 0 0 1.5rem 0; letter-spacing: -3px; }
          h2 { font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 800; line-height: 1.1; margin: 0 0 1.5rem 0; letter-spacing: -2px; }
          p { font-size: 1.15rem; color: var(--text-muted); line-height: 1.7; font-weight: 400; margin: 0; }
          
          .text-highlight { color: #fff; font-weight: 600; }
          .text-theme { color: var(--theme-color); transition: color 0.5s ease; }

          /* Grid Dinâmico de Especificações */
          .specs-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 2rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--glass-border);
          }
          .spec-item { display: flex; flex-direction: column; gap: 5px; }
          .spec-value { font-size: 2.5rem; font-weight: 800; color: #fff; letter-spacing: -1px; }
          .spec-label { font-size: 0.8rem; color: var(--theme-color); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; transition: color 0.5s ease;}

          /* Botão Premium Reativo */
          .btn-primary {
            background: var(--theme-color); color: #000; border: none;
            padding: 1.2rem 3.5rem; font-size: 1rem; font-weight: 900; text-transform: uppercase;
            letter-spacing: 2px; border-radius: 50px; cursor: pointer; 
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            margin-top: 3rem; display: inline-block; pointer-events: auto;
          }
          .btn-primary:hover {
            transform: translateY(-8px) scale(1.05); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px var(--theme-color);
            background: #fff;
          }

          /* Loader High-Tech */
          .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-dark); width: 100vw; height: 100vh; position: absolute; top: -50vh; left: -50vw; z-index: 9999; }
          .loader-glitch { font-size: 3rem; font-weight: 900; letter-spacing: 10px; margin-bottom: 30px; color: #fff; position: relative; }
          .loader-bar-bg { width: 400px; max-width: 80vw; height: 2px; background: rgba(255,255,255,0.05); margin-bottom: 20px; position: relative; overflow: hidden; }
          .loader-bar-fill { height: 100%; transition: width 0.2s ease, background 0.5s ease; }
          .loader-text { font-family: monospace; font-size: 0.85rem; letter-spacing: 3px; text-transform: uppercase; transition: color 0.5s ease; }

          /* Media Queries para Mobile */
          @media (max-width: 768px) {
            .nav-links { display: none; }
            .navbar { padding: 1.5rem 5%; }
            .section-content { justify-content: center !important; text-align: center !important; }
            .glass-panel { padding: 2.5rem 1.5rem; background: rgba(5,5,8,0.7); max-width: 100%; }
            .specs-grid { border-top: none; padding-top: 1rem; }
            .theme-controller { bottom: 20px; left: 50%; transform: translateX(-50%); width: max-content; }
          }
        `}</style>

        {/* ==========================================
            9. INTERFACE HTML PERMANENTE
            ========================================== */}
        <div className="reading-progress" ref={progressRef}>
          <div className="reading-progress-fill"></div>
        </div>

        <NavBar currentTheme={currentTheme} />
        <ThemeController />

        {/* ==========================================
            10. O PALCO 3D PERMANENTE
            ========================================== */}
        <div className="canvas-container">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={isMobile ? 60 : 45} />
            <SceneLighting isMobile={isMobile} />
            
            <Suspense fallback={<Loader />}>
              <GpuModel isMobile={isMobile} />
            </Suspense>
          </Canvas>
        </div>

        {/* ==========================================
            11. SEÇÕES DINÂMICAS DO SITE (SCROLL)
            ========================================== */}
        
        {/* SEÇÃO 1: HERO */}
        <div className="ui-layer" ref={sectionRefs[0]}>
          <div className="section-content" style={{ justifyContent: 'flex-start' }}>
            <div className="glass-panel">
              <span className="tagline">Arquitetura Ada Lovelace</span>
              <h1>A Placa <br/>Definitiva.</h1>
              <p>Prepare-se para o ápice do design térmico e da potência gráfica. A <span className="text-highlight">GeForce RTX™ 4090</span> muda as regras do jogo, da criação de conteúdo e do processamento de Inteligência Artificial.</p>
              <button className="btn-primary" onClick={() => window.scrollTo({top: window.innerHeight * 4, behavior: 'smooth'})}>
                Explorar Compra
              </button>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DESEMPENHO BRUTO */}
        <div className="ui-layer" ref={sectionRefs[1]} style={{ opacity: 0 }}>
          <div className="section-content" style={{ justifyContent: 'flex-end', textAlign: isMobile ? 'center' : 'right' }}>
            <div className="glass-panel" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <span className="tagline">Força Computacional</span>
              <h2>O Dobro de <br/><span className="text-theme">Performance.</span></h2>
              <p>Novos multiprocessadores de streaming e núcleos Tensor de 4ª geração garantem um salto quântico. Experimente o poder que quebra os limites do fotorrealismo em tempo real.</p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: ENGENHARIA E REFRIGERAÇÃO */}
        <div className="ui-layer" ref={sectionRefs[2]} style={{ opacity: 0 }}>
          <div className="section-content" style={{ justifyContent: 'flex-start' }}>
            <div className="glass-panel">
              <span className="tagline">Engenharia Térmica</span>
              <h2>Frio.<br/>Silencioso.<br/><span className="text-theme">Implacável.</span></h2>
              <p>Ventoinhas duplas de fluxo axial maiores e uma câmara de vapor redesenhada. Aumentamos o fluxo de ar em 20% para manter o poder máximo em silêncio absoluto, independentemente da carga térmica exigida pelos motores de renderização.</p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ESPECIFICAÇÕES TÉCNICAS */}
        <div className="ui-layer" ref={sectionRefs[3]} style={{ opacity: 0 }}>
          <div className="section-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div className="glass-panel" style={{ maxWidth: '800px', background: 'var(--bg-dark)', border: '1px solid var(--theme-color)' }}>
              <span className="tagline">Sob o Capô</span>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Especificações da <span className="text-theme">Fera</span>.</h2>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-value">24<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>GB</span></span>
                  <span className="spec-label">GDDR6X VRAM</span>
                </div>
                <div className="spec-item">
                  <span className="spec-value">16384</span>
                  <span className="spec-label">NVIDIA CUDA® Cores</span>
                </div>
                <div className="spec-item">
                  <span className="spec-value">2.52<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>GHz</span></span>
                  <span className="spec-label">Boost Clock</span>
                </div>
                <div className="spec-item">
                  <span className="spec-value">3rd Gen</span>
                  <span className="spec-label">RT Cores</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: COMPRAR / FINAL (FOOTER GIGANTE) */}
        <div className="ui-layer" ref={sectionRefs[4]} style={{ opacity: 0 }}>
          <div className="section-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(5rem, 12vw, 10rem)', marginBottom: 0, textShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                RTX <span className="text-theme">4090</span>
              </h1>
              <p style={{ fontSize: '1.8rem', color: '#fff', marginTop: '1rem', fontWeight: 200, letterSpacing: '2px' }}>
                O Futuro já está renderizado.
              </p>
              <button className="btn-primary" style={{ padding: '1.5rem 5rem', fontSize: '1.2rem', marginTop: '4rem' }}>
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>

      </div>
    </ThemeContext.Provider>
  );
}