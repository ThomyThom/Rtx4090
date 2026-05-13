import React, { useRef, useLayoutEffect, useEffect, useState, Suspense, createContext, useContext, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  ContactShadows, 
  Float, 
  Html,
  PerspectiveCamera,
  Stars
} from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// 1. DADOS ESTÁTICOS E CONFIGURAÇÕES (DATA MOCKING)
// ============================================================================

const GPU_DATA = {
  name: "NVIDIA RTX 4090",
  tagline: "O Poder Absoluto",
  specs: [
    { label: "CUDA Cores", value: "16384", desc: "Poder de processamento paralelo extremo" },
    { label: "Boost Clock", value: "2.52 GHz", desc: "Velocidade máxima da GPU" },
    { label: "Memória", value: "24 GB", desc: "GDDR6X de altíssima velocidade" },
    { label: "Ray Tracing", value: "3ª Gen", desc: "Núcleos dedicados para física de luz" },
    { label: "Tensor Cores", value: "4ª Gen", desc: "Aceleração de Inteligência Artificial" },
    { label: "Consumo (TGP)", value: "450W", desc: "Eficiência energética arquitetura Ada" }
  ],
  benchmarks: [
    { title: "Cyberpunk 2077 (RT Overdrive)", rtx4090: 135, rtx3090: 42 },
    { title: "Microsoft Flight Simulator", rtx4090: 162, rtx3090: 85 },
    { title: "Blender Render Time (Segundos - Menor é melhor)", rtx4090: 12, rtx3090: 28 },
    { title: "Portal with RTX", rtx4090: 118, rtx3090: 31 }
  ],
  faqs: [
    { q: "Qual o tamanho da RTX 4090?", a: "A Founders Edition ocupa 3 slots do gabinete (304mm x 137mm x 61mm). Verifique a compatibilidade do seu gabinete." },
    { q: "Qual fonte de alimentação (PSU) é recomendada?", a: "Recomendamos uma fonte de pelo menos 850W com certificação 80+ Gold, preferencialmente com o novo cabo PCIe 5.0 (12VHPWR)." },
    { q: "Ela suporta DLSS 3?", a: "Sim. A arquitetura Ada Lovelace introduz o DLSS 3 com Optical Multi Frame Generation, exclusivo da série RTX 40." },
    { q: "É boa para criadores de conteúdo?", a: "É a placa definitiva. Os codificadores duplos AV1 reduzem o tempo de exportação pela metade e melhoram a qualidade das lives." }
  ]
};

const THEMES = {
  nvidia: { id: 'nvidia', color: '#76b900', name: 'NVIDIA Green', bg: '#030305' },
  studio: { id: 'studio', color: '#ffffff', name: 'Creator White', bg: '#0a0a0c' },
  cyber:  { id: 'cyber', color: '#00ffcc', name: 'Neon Cyber', bg: '#01050a' },
  siren:  { id: 'siren', color: '#ff0055', name: 'Red Alert', bg: '#1a0005' }
};

// ============================================================================
// 2. CONTEXTOS GLOBAIS (STATE MANAGEMENT)
// ============================================================================

const AppContext = createContext();

// ============================================================================
// 3. HOOKS CUSTOMIZADOS AVANÇADOS
// ============================================================================

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

function useMousePosition() {
  const [mouse, setMouse] = useState({ x: 0, y: 0, pixelX: 0, pixelY: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
        pixelX: e.clientX,
        pixelY: e.clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return mouse;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setProgress(Number(scroll));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return progress;
}

// ============================================================================
// 4. COMPONENTES DE INTERFACE BASE (UI SYSTEM)
// ============================================================================

function CustomCursor({ mouse, isMobile }) {
  const cursorRef = useRef();
  const cursorDotRef = useRef();
  
  useEffect(() => {
    if (isMobile) return;
    gsap.to(cursorRef.current, { x: mouse.pixelX, y: mouse.pixelY, duration: 0.15, ease: "power2.out" });
    gsap.to(cursorDotRef.current, { x: mouse.pixelX, y: mouse.pixelY, duration: 0.05, ease: "power2.out" });
  }, [mouse, isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
    </>
  );
}

function Loader() {
  const { progress } = useProgress();
  const { theme } = useContext(AppContext);
  return (
    <Html center zIndexRange={[100, 0]}>
      <div className="loader-screen">
        <div className="loader-content">
          <div className="glitch-text" data-text="RTX_4090">RTX_4090</div>
          <div className="loader-bar-wrapper">
            <div className="loader-bar-fill" style={{ width: `${progress}%`, backgroundColor: theme.color, boxShadow: `0 0 20px ${theme.color}` }} />
          </div>
          <div className="loader-details">
            <span style={{ color: theme.color }}>VRAM_SYNC... {progress.toFixed(0)}%</span>
            <span style={{ color: '#555' }}>[ADA_LOVELACE_ARCHITECTURE]</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useContext(AppContext);
  return (
    <div className="theme-panel">
      <span className="theme-panel-title">Chroma Control</span>
      <div className="theme-options">
        {Object.values(THEMES).map((t) => (
          <button
            key={t.id}
            className={`theme-dot ${theme.id === t.id ? 'active' : ''}`}
            style={{ backgroundColor: t.color, boxShadow: theme.id === t.id ? `0 0 15px ${t.color}` : 'none' }}
            onClick={() => setTheme(t)}
            aria-label={`Mudar para o tema ${t.name}`}
          />
        ))}
      </div>
      <span className="theme-panel-name" style={{ color: theme.color }}>{theme.name}</span>
    </div>
  );
}

function Navigation({ progress }) {
  const { theme } = useContext(AppContext);
  
  const scrollTo = (vh) => {
    window.scrollTo({ top: window.innerHeight * vh, behavior: 'smooth' });
  };

  return (
    <header className="navbar">
      <div className="nav-logo" onClick={() => scrollTo(0)}>
        GEFORCE<span className="nav-dot" style={{ color: theme.color }}>.</span>
      </div>
      <nav className="nav-links">
        <button onClick={() => scrollTo(0)}>Home</button>
        <button onClick={() => scrollTo(1)}>Performance</button>
        <button onClick={() => scrollTo(2.5)}>Engenharia</button>
        <button onClick={() => scrollTo(4)}>Especificações</button>
        <button onClick={() => scrollTo(6)}>Comprar</button>
      </nav>
      <div className="nav-progress-bar">
        <div className="nav-progress-fill" style={{ width: `${progress * 100}%`, backgroundColor: theme.color }} />
      </div>
    </header>
  );
}

// ============================================================================
// 5. COMPONENTES INTERATIVOS DE CONTEÚDO (HTML)
// ============================================================================

function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const { theme } = useContext(AppContext);

  return (
    <div className="accordion-container">
      {items.map((item, i) => (
        <div key={i} className={`accordion-item ${openIndex === i ? 'open' : ''}`}>
          <button className="accordion-header" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <span className="accordion-title">{item.q}</span>
            <span className="accordion-icon" style={{ color: theme.color }}>{openIndex === i ? '−' : '+'}</span>
          </button>
          <div className="accordion-content" style={{ maxHeight: openIndex === i ? '200px' : '0' }}>
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BenchmarkChart() {
  const { theme } = useContext(AppContext);
  
  return (
    <div className="chart-container">
      {GPU_DATA.benchmarks.map((bench, idx) => {
        // Calcula a porcentagem para desenhar as barras (assumindo max 200 para escala visual)
        const maxVal = Math.max(bench.rtx4090, bench.rtx3090) * 1.2;
        const width4090 = (bench.rtx4090 / maxVal) * 100;
        const width3090 = (bench.rtx3090 / maxVal) * 100;

        return (
          <div key={idx} className="chart-row">
            <span className="chart-title">{bench.title}</span>
            <div className="chart-bars">
              <div className="chart-bar-group">
                <span className="chart-label">RTX 4090</span>
                <div className="chart-track">
                  <div className="chart-fill fill-4090" style={{ width: `${width4090}%`, backgroundColor: theme.color }}>
                    <span className="chart-value">{bench.rtx4090}</span>
                  </div>
                </div>
              </div>
              <div className="chart-bar-group">
                <span className="chart-label">RTX 3090</span>
                <div className="chart-track">
                  <div className="chart-fill fill-3090" style={{ width: `${width3090}%`, backgroundColor: '#444' }}>
                    <span className="chart-value">{bench.rtx3090}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BootTerminal() {
  const { theme } = useContext(AppContext);
  const [lines, setLines] = useState([]);
  
  const bootSequence = useMemo(() => [
    "INITIALIZING KERNEL...",
    "LOADING ADA LOVELACE ARCHITECTURE...",
    "VRAM DETECTED: 24576 MB GDDR6X",
    "CUDA CORES: 16384 ONLINE",
    "TENSOR CORES: OPTIMIZED FOR DLSS 3",
    "RT CORES: ACTIVE",
    "SYSTEM READY. OVERCLOCK ENABLED."
  ], []);

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootSequence.length) {
        setLines(prev => [...prev, bootSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [bootSequence]);

  return (
    <div className="terminal-box">
      <div className="terminal-header">
        <span className="dot" style={{ background: '#ff5f56' }}/>
        <span className="dot" style={{ background: '#ffbd2e' }}/>
        <span className="dot" style={{ background: '#27c93f' }}/>
        <span className="terminal-title">bash - root@nvidia-mainframe</span>
      </div>
      <div className="terminal-body" style={{ color: theme.color }}>
        {lines.map((line, i) => (
          <div key={i} className="terminal-line">{`> ${line}`}</div>
        ))}
        <div className="terminal-cursor">_</div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. COMPONENTES 3D AVANÇADOS (R3F)
// ============================================================================

function Hotspot({ position, title, description, visible }) {
  const { theme } = useContext(AppContext);
  
  return (
    <Html position={position} center style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: visible ? 'auto' : 'none' }}>
      <div className="hotspot-container">
        <div className="hotspot-dot" style={{ backgroundColor: theme.color, boxShadow: `0 0 10px ${theme.color}` }}>
          <div className="hotspot-pulse" style={{ borderColor: theme.color }} />
        </div>
        <div className="hotspot-card">
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      </div>
    </Html>
  );
}

function ComplexParticles({ isMobile }) {
  const { theme } = useContext(AppContext);
  const count = isMobile ? 150 : 400;
  
  // Criamos uma nuvem de partículas customizada usando matemática do Three.js
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;     // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z
    }
    return pos;
  }, [count]);

  const pointsRef = useRef();

  useFrame((state) => {
    if (!pointsRef.current) return;
    // Rotação suave constante de toda a nuvem de partículas
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        color={theme.color} 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
}

function CinematicLighting() {
  const { theme } = useContext(AppContext);
  const lightRef = useRef();

  // A luz pulsa levemente simulando energia
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 8 + Math.sin(state.clock.getElapsedTime() * 2) * 1.5;
    }
  });

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.2} />
      {/* Luz principal Branca */}
      <directionalLight position={[10, 20, 10]} intensity={2.5} color="#ffffff" castShadow />
      {/* Luz de Preenchimento Temática Constante */}
      <spotLight position={[-10, -10, -10]} angle={0.8} penumbra={1} intensity={6} color={theme.color} />
      {/* Luz Temática Pulsante Animada */}
      <spotLight ref={lightRef} position={[5, 5, 5]} angle={0.4} penumbra={0.8} color={theme.color} />
      
      {/* Sombras super realistas no chão infinito */}
      <ContactShadows position={[0, -3.5, 0]} opacity={0.9} scale={30} blur={3} far={10} color="#000" />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
    </>
  );
}

function GpuCoreography({ isMobile }) {
  const { scene } = useGLTF('/geforce_rtx_4090_founders_edition.glb'); 
  const scrollRef = useRef();
  const floatRef = useRef();
  const mouse = useMousePosition();
  const [hotspotsVisible, setHotspotsVisible] = useState(false);

  // Parallax super suave reagindo ao mouse (independente do GSAP)
  useFrame(() => {
    if (!isMobile && floatRef.current) {
      const targetX = mouse.x * 0.2;
      const targetY = mouse.y * 0.2;
      floatRef.current.rotation.x += (targetY - floatRef.current.rotation.x) * 0.08;
      floatRef.current.rotation.y += (targetX - floatRef.current.rotation.y) * 0.08;
    }
  });

  // A Grande Coreografia do GSAP
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroller",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
          onUpdate: (self) => {
            // Mostra os Hotspots apenas na Seção de Engenharia (progresso ~0.4 a 0.6)
            if (self.progress > 0.35 && self.progress < 0.65) {
              setHotspotsVisible(true);
            } else {
              setHotspotsVisible(false);
            }
          }
        }
      });

      const offset = isMobile ? 0 : 2.5;
      const scale = isMobile ? 0.008 : 0.012;

      // 0. INIT (Hero)
      gsap.set(scrollRef.current.position, { x: offset, y: -0.5, z: 0 });
      gsap.set(scrollRef.current.rotation, { x: 0.3, y: -0.6, z: 0.1 });
      gsap.set(scrollRef.current.scale, { x: scale, y: scale, z: scale });

      // 1. PERFORMANCE (Esquerda)
      tl.to(scrollRef.current.position, { x: -offset, y: 0, z: 1, ease: "power2.inOut" }, 0);
      tl.to(scrollRef.current.rotation, { x: 0.1, y: Math.PI / 4, z: -0.1, ease: "power2.inOut" }, 0);

      // 2. ENGENHARIA (Centro, mostrando Fans e Hotspots)
      tl.to(scrollRef.current.position, { x: 0, y: -1, z: 2, ease: "power2.inOut" }, 1);
      tl.to(scrollRef.current.rotation, { x: -0.4, y: Math.PI + 0.5, z: 0.2, ease: "power2.inOut" }, 1);

      // 3. SPECS (Sobe e mostra o backplate)
      tl.to(scrollRef.current.position, { x: isMobile ? 0 : offset, y: 1, z: 0, ease: "power3.inOut" }, 2);
      tl.to(scrollRef.current.rotation, { x: 0.5, y: Math.PI * 2, z: -0.2, ease: "power3.inOut" }, 2);

      // 4. BENCHMARKS (Esquerda deitado)
      tl.to(scrollRef.current.position, { x: -offset, y: 0, z: 1.5, ease: "power2.inOut" }, 3);
      tl.to(scrollRef.current.rotation, { x: Math.PI / 2, y: 0, z: Math.PI, ease: "power2.inOut" }, 3);

      // 5. FOOTER CTA (Centro Épico)
      tl.to(scrollRef.current.position, { x: 0, y: -0.5, z: 3, ease: "power1.out" }, 4);
      tl.to(scrollRef.current.rotation, { x: 0.1, y: Math.PI * 2.1, z: 0, ease: "power1.out" }, 4);

    });
    return () => ctx.revert();
  }, [isMobile]);

  return (
    <group ref={scrollRef}>
      <group ref={floatRef}>
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.4}>
          <primitive object={scene} />
          
          {/* Hotspots posicionados relativos à malha 3D */}
          <Hotspot 
            position={[0, 150, 50]} 
            title="Câmara de Vapor" 
            description="Dissipação de calor revolucionária." 
            visible={hotspotsVisible} 
          />
          <Hotspot 
            position={[0, -100, -50]} 
            title="Dual Axial Fans" 
            description="20% mais fluxo de ar silencioso." 
            visible={hotspotsVisible} 
          />
        </Float>
      </group>
    </group>
  );
}

// ============================================================================
// 7. ESTRUTURA PRINCIPAL (O MOTOR DO SITE)
// ============================================================================

export default function App() {
  const [theme, setTheme] = useState(THEMES.nvidia);
  const { isMobile } = useWindowSize();
  const mouse = useMousePosition();
  const scrollProgress = useScrollProgress();

  // Refs de todas as seções para animação de revelação do HTML
  const sRefHero = useRef();
  const sRefPerf = useRef();
  const sRefEng = useRef();
  const sRefSpecs = useRef();
  const sRefBench = useRef();
  const sRefFaq = useRef();
  const sRefCta = useRef();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const domTl = gsap.timeline({
        scrollTrigger: { trigger: "#scroller", start: "top top", end: "bottom bottom", scrub: 1 }
      });

      const animateSection = (ref, start, end) => {
        if (!ref.current) return;
        domTl.fromTo(ref.current, { opacity: 0, y: 100, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.3 }, start);
        domTl.to(ref.current, { opacity: 0, y: -100, filter: "blur(10px)", duration: 0.3 }, end);
      };

      // Distribuição do tempo no scroll (0 a 6 etapas)
      animateSection(sRefPerf, 0.5, 1.5);
      animateSection(sRefEng, 1.5, 2.5);
      animateSection(sRefSpecs, 2.5, 3.5);
      animateSection(sRefBench, 3.5, 4.5);
      animateSection(sRefFaq, 4.5, 5.5);
      
      // CTA Hero entra logo de cara, sai no 0.5
      domTl.to(sRefHero.current, { opacity: 0, y: -100, filter: "blur(10px)", duration: 0.3 }, 0.5);
      
      // Footer entra no final e fica
      domTl.fromTo(sRefCta.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3 }, 5.5);
    });
    return () => ctx.revert();
  }, []);

  return (
    <AppContext.Provider value={{ theme, setTheme }}>
      
      {/* ============================================================================
          8. O MEGA BLOCO CSS INJETADO (OVERHAUL VISUAL ABSOLUTO)
          ============================================================================ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        :root {
          --bg-dark: ${theme.bg};
          --text-main: #f5f5f7;
          --text-muted: #86868b;
          --glass-bg: rgba(20, 20, 25, 0.3);
          --glass-border: rgba(255, 255, 255, 0.08);
          --theme-color: ${theme.color};
        }

        /* RESET SUPREMO PARA ELIMINAR LINHAS VERTICAIS E SCROLL HORIZONTAL */
        *, *::before, *::after { box-sizing: border-box; }
        
        body, html { 
          margin: 0; padding: 0; 
          width: 100%; min-height: 100vh;
          background-color: var(--bg-dark); 
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          /* O segredo final contra o vazamento de layout do Windows */
          overflow-x: clip; 
          overscroll-behavior: none;
          transition: background-color 0.8s ease;
        }

        /* CONTAINER PRINCIPAL DE ROLAGEM */
        #scroller {
          width: 100%;
          height: 700vh; /* 7 seções enormes de conteúdo */
          position: relative;
          overflow-x: clip;
        }

        /* CUSTOM SCROLLBAR REATIVA */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: var(--theme-color); border-radius: 4px; transition: background 0.5s; }

        /* CURSOR CUSTOMIZADO */
        .cursor-ring { position: fixed; top: 0; left: 0; width: 30px; height: 30px; border: 1px solid var(--theme-color); border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); transition: width 0.2s, height 0.2s, background 0.2s; mix-blend-mode: difference; }
        .cursor-dot { position: fixed; top: 0; left: 0; width: 6px; height: 6px; background: var(--theme-color); border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); }
        a:hover ~ .cursor-ring, button:hover ~ .cursor-ring { width: 50px; height: 50px; background: rgba(255,255,255,0.1); }

        /* NAVEGAÇÃO */
        .navbar { position: fixed; top: 0; left: 0; width: 100%; padding: 1.5rem 4%; display: flex; justify-content: space-between; align-items: center; z-index: 50; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); backdrop-filter: blur(5px); }
        .nav-logo { font-size: 1.5rem; font-weight: 900; letter-spacing: 1px; cursor: pointer; }
        .nav-dot { transition: color 0.5s; }
        .nav-links { display: flex; gap: 2rem; }
        .nav-links button { background: none; border: none; color: var(--text-muted); font-family: 'Inter'; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: color 0.3s; }
        .nav-links button:hover { color: #fff; }
        .nav-progress-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.1); }
        .nav-progress-fill { height: 100%; transition: width 0.1s linear, background 0.5s; }

        /* TEMA CONTROLLER */
        .theme-panel { position: fixed; bottom: 30px; left: 4%; z-index: 50; display: flex; flex-direction: column; gap: 10px; background: var(--glass-bg); padding: 15px 20px; border-radius: 15px; border: 1px solid var(--glass-border); backdrop-filter: blur(10px); }
        .theme-panel-title { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); }
        .theme-options { display: flex; gap: 12px; }
        .theme-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; padding: 0; }
        .theme-dot:hover { transform: scale(1.2); }
        .theme-panel-name { font-size: 0.7rem; font-weight: 800; font-family: 'JetBrains Mono'; text-transform: uppercase; transition: color 0.5s; }

        /* CANVAS 3D CONTAINER */
        .canvas-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1; pointer-events: none; }

        /* SISTEMA DE SEÇÕES DA UI */
        .ui-layer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 10; pointer-events: none; display: flex; align-items: center; justify-content: center; }
        .ui-container { width: 100%; max-width: 1400px; padding: 0 5%; display: flex; }
        
        .glass-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 24px; padding: 3rem; backdrop-filter: blur(15px); pointer-events: auto; width: 100%; max-width: 600px; transition: box-shadow 0.3s; }
        .glass-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

        /* TIPOGRAFIA */
        .overline { font-size: 0.85rem; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: var(--theme-color); margin-bottom: 1rem; display: block; transition: color 0.5s; }
        h1 { font-size: clamp(3.5rem, 8vw, 6.5rem); font-weight: 900; line-height: 1.05; letter-spacing: -3px; margin: 0 0 1.5rem 0; }
        h2 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 1.5rem 0; }
        h3 { font-size: 2rem; font-weight: 800; margin-bottom: 2rem; }
        p { font-size: 1.1rem; color: var(--text-muted); line-height: 1.6; margin: 0 0 1.5rem 0; font-weight: 400; }
        .text-glow { color: var(--theme-color); text-shadow: 0 0 30px rgba(255,255,255,0.2); transition: color 0.5s; }

        /* BOTÕES */
        .btn { background: var(--theme-color); color: #000; border: none; padding: 1.2rem 3rem; font-size: 0.9rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border-radius: 50px; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: inline-block; pointer-events: auto; margin-top: 1rem; }
        .btn:hover { transform: translateY(-5px) scale(1.05); background: #fff; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
        .btn-outline { background: transparent; border: 2px solid var(--theme-color); color: var(--text-main); margin-left: 1rem; }
        .btn-outline:hover { background: var(--theme-color); color: #000; }

        /* GRID DE ESPECIFICAÇÕES */
        .grid-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-top: 2rem; }
        .spec-box { border-left: 3px solid var(--theme-color); padding-left: 1.5rem; transition: border-color 0.5s; }
        .spec-val { display: block; font-size: 2.5rem; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 0.5rem; }
        .spec-lbl { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }

        /* HOTSPOTS 3D */
        .hotspot-container { position: relative; display: flex; align-items: center; gap: 15px; }
        .hotspot-dot { width: 16px; height: 16px; border-radius: 50%; position: relative; transition: background 0.5s; cursor: pointer; }
        .hotspot-pulse { position: absolute; top: -5px; left: -5px; right: -5px; bottom: -5px; border-radius: 50%; border: 2px solid; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
        .hotspot-card { background: var(--glass-bg); padding: 15px 20px; border-radius: 10px; border: 1px solid var(--glass-border); width: max-content; backdrop-filter: blur(10px); }
        .hotspot-card h4 { margin: 0 0 5px 0; font-size: 1rem; font-weight: 800; color: #fff; }
        .hotspot-card p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

        /* GRÁFICO BENCHMARK */
        .chart-container { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; }
        .chart-row { display: flex; flex-direction: column; gap: 0.5rem; }
        .chart-title { font-size: 0.9rem; font-weight: 600; letter-spacing: 1px; color: #fff; }
        .chart-bars { display: flex; flex-direction: column; gap: 8px; }
        .chart-bar-group { display: flex; align-items: center; gap: 15px; }
        .chart-label { font-size: 0.75rem; width: 60px; color: var(--text-muted); font-weight: 800; }
        .chart-track { flex: 1; height: 24px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; position: relative; }
        .chart-fill { height: 100%; display: flex; align-items: center; padding: 0 10px; transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s; }
        .chart-value { font-size: 0.75rem; font-weight: 900; font-family: 'JetBrains Mono'; color: #000; text-shadow: none; }
        .fill-3090 .chart-value { color: #fff; }

        /* ACCORDION FAQ */
        .accordion-container { display: flex; flex-direction: column; gap: 10px; }
        .accordion-item { border: 1px solid var(--glass-border); border-radius: 12px; background: rgba(0,0,0,0.2); overflow: hidden; transition: background 0.3s; }
        .accordion-header { width: 100%; padding: 20px; display: flex; justify-content: space-between; align-items: center; background: none; border: none; color: #fff; cursor: pointer; font-size: 1rem; font-weight: 600; text-align: left; }
        .accordion-icon { font-size: 1.5rem; font-weight: 400; transition: color 0.5s; }
        .accordion-content { padding: 0 20px; transition: max-height 0.4s ease-out; overflow: hidden; }
        .accordion-content p { font-size: 0.95rem; margin-bottom: 20px; }
        .accordion-item.open { background: var(--glass-bg); border-color: var(--theme-color); }

        /* TERMINAL EASTER EGG */
        .terminal-box { background: #0c0c0c; border-radius: 10px; overflow: hidden; font-family: 'JetBrains Mono', monospace; border: 1px solid #333; margin-top: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .terminal-header { background: #1a1a1a; padding: 10px 15px; display: flex; align-items: center; gap: 8px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .terminal-title { color: #888; font-size: 0.8rem; margin-left: 10px; }
        .terminal-body { padding: 20px; font-size: 0.85rem; line-height: 1.8; min-height: 200px; transition: color 0.5s; }
        .terminal-cursor { display: inline-block; width: 10px; height: 1.2em; background: currentColor; vertical-align: middle; animation: blink 1s step-end infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* LOADER GIGANTE */
        .loader-screen { background: var(--bg-dark); width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; }
        .loader-content { width: 80%; max-width: 500px; }
        .glitch-text { font-size: 3rem; font-weight: 900; letter-spacing: 5px; margin-bottom: 20px; position: relative; }
        .loader-bar-wrapper { height: 2px; background: rgba(255,255,255,0.1); width: 100%; margin-bottom: 20px; position: relative; }
        .loader-bar-fill { height: 100%; transition: width 0.1s, background 0.5s; }
        .loader-details { display: flex; justify-content: space-between; font-family: 'JetBrains Mono'; font-size: 0.75rem; letter-spacing: 1px; }

        /* RESPONSIVO MULTI-DEVICES */
        @media (max-width: 1024px) {
          .ui-container { padding: 0 4%; }
          .nav-links { display: none; }
          .grid-specs { grid-template-columns: 1fr; gap: 1rem; }
        }
        @media (max-width: 768px) {
          h1 { font-size: 3.5rem; }
          h2 { font-size: 2.2rem; }
          .ui-container { justify-content: center !important; }
          .glass-card { padding: 2rem; background: rgba(10,10,15,0.7); text-align: center; }
          .theme-panel { bottom: 20px; left: 50%; transform: translateX(-50%); flex-direction: row; align-items: center; width: max-content; }
          .chart-bar-group { flex-direction: column; align-items: flex-start; gap: 5px; }
          .chart-track { width: 100%; }
        }
      `}</style>

      {/* ============================================================================
          9. UI PERSISTENTE E CURSOR
          ============================================================================ */}
      <CustomCursor mouse={mouse} isMobile={isMobile} />
      <Navigation progress={scrollProgress} />
      <ThemeSelector />

      {/* ============================================================================
          10. O PALCO 3D (Z-INDEX 1)
          ============================================================================ */}
      <div className="canvas-bg">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={isMobile ? 60 : 45} />
          <CinematicLighting />
          <ComplexParticles isMobile={isMobile} />
          <Suspense fallback={<Loader />}>
            <GpuCoreography isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </div>

      {/* ============================================================================
          11. CONTEÚDO HTML DO SITE (DIVIDIDO EM 7 SEÇÕES)
          ============================================================================ */}
      <div id="scroller">
        
        {/* SEÇÃO 1: HERO OVERLAY */}
        <div className="ui-layer" ref={sRefHero}>
          <div className="ui-container" style={{ justifyContent: 'flex-start' }}>
            <div className="glass-card">
              <span className="overline">{GPU_DATA.name}</span>
              <h1>A Placa <br/>Definitiva.</h1>
              <p>Prepare-se para o ápice do design térmico e da potência gráfica extrema. O futuro da renderização e da Inteligência Artificial chegou.</p>
              <button className="btn" onClick={() => window.scrollTo({top: window.innerHeight * 6, behavior: 'smooth'})}>Comprar Agora</button>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: PERFORMANCE BRUTA */}
        <div className="ui-layer" ref={sRefPerf} style={{ opacity: 0 }}>
          <div className="ui-container" style={{ justifyContent: 'flex-end', textAlign: isMobile ? 'center' : 'right' }}>
            <div className="glass-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <span className="overline">Arquitetura Ada Lovelace</span>
              <h2>Poder de Fogo <br/><span className="text-glow">Extremo.</span></h2>
              <p>Novos multiprocessadores de streaming e núcleos Tensor de 4ª geração garantem um salto quântico. Experimente o poder que quebra as barreiras do fotorrealismo.</p>
              
              <div className="grid-specs" style={{ textAlign: 'left' }}>
                <div className="spec-box">
                  <span className="spec-val">16384</span>
                  <span className="spec-lbl">NVIDIA CUDA® Cores</span>
                </div>
                <div className="spec-box">
                  <span className="spec-val">2.52<span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>GHz</span></span>
                  <span className="spec-lbl">Boost Clock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: ENGENHARIA (COM HOTSPOTS ATIVOS) */}
        <div className="ui-layer" ref={sRefEng} style={{ opacity: 0, pointerEvents: 'none' }}>
          <div className="ui-container" style={{ justifyContent: 'flex-start', alignItems: 'flex-end', paddingBottom: '10vh' }}>
            <div className="glass-card" style={{ maxWidth: '400px' }}>
              <span className="overline">Engenharia Térmica</span>
              <h2>Frio. <br/>Silencioso.<br/><span className="text-glow">Implacável.</span></h2>
              <p>O design térmico Founders Edition otimiza o fluxo de ar, permitindo operação no limite sem comprometer o conforto acústico.</p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ESPECIFICAÇÕES COMPLEXAS & TERMINAL */}
        <div className="ui-layer" ref={sRefSpecs} style={{ opacity: 0 }}>
          <div className="ui-container" style={{ justifyContent: 'flex-start' }}>
            <div className="glass-card" style={{ maxWidth: '650px' }}>
              <span className="overline">Sob o Capô</span>
              <h2>Coração de <span className="text-glow">Silício.</span></h2>
              <p>A primeira GPU desenvolvida para a era da computação acelerada e IA generativa local.</p>
              
              <div className="grid-specs">
                <div className="spec-box"><span className="spec-val">24GB</span><span className="spec-lbl">GDDR6X VRAM</span></div>
                <div className="spec-box"><span className="spec-val">450W</span><span className="spec-lbl">TGP Otimizado</span></div>
                <div className="spec-box"><span className="spec-val">3ª Gen</span><span className="spec-lbl">Ray Tracing Cores</span></div>
                <div className="spec-box"><span className="spec-val">4ª Gen</span><span className="spec-lbl">Tensor Cores AI</span></div>
              </div>

              {!isMobile && <BootTerminal />}
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: BENCHMARKS INTERATIVOS */}
        <div className="ui-layer" ref={sRefBench} style={{ opacity: 0 }}>
          <div className="ui-container" style={{ justifyContent: 'flex-end' }}>
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <span className="overline">Testes de Laboratório</span>
              <h2>FPS não é <br/>mais um <span className="text-glow">Limite.</span></h2>
              <p style={{ marginBottom: '2rem' }}>O DLSS 3 com geração ótica de quadros multiplica o desempenho nos títulos mais pesados do mercado.</p>
              <BenchmarkChart />
            </div>
          </div>
        </div>

        {/* SEÇÃO 6: SISTEMA DE FAQ */}
        <div className="ui-layer" ref={sRefFaq} style={{ opacity: 0 }}>
          <div className="ui-container" style={{ justifyContent: 'center' }}>
            <div className="glass-card" style={{ maxWidth: '800px' }}>
              <span className="overline">Central de Conhecimento</span>
              <h2 style={{ textAlign: 'center' }}>Perguntas Frequentes</h2>
              <Accordion items={GPU_DATA.faqs} />
            </div>
          </div>
        </div>

        {/* SEÇÃO 7: MEGA CTA FOOTER */}
        <div className="ui-layer" ref={sRefCta} style={{ opacity: 0 }}>
          <div className="ui-container" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(5rem, 15vw, 12rem)', textShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
                RTX <span className="text-glow">4090</span>
              </h1>
              <p style={{ fontSize: '1.5rem', color: '#fff', margin: '1rem 0 3rem 0', letterSpacing: '3px', textTransform: 'uppercase' }}>
                O Futuro da Renderização
              </p>
              <button className="btn" style={{ padding: '1.5rem 4rem', fontSize: '1.2rem' }}>Adicionar ao Carrinho</button>
              <button className="btn btn-outline" style={{ padding: '1.5rem 4rem', fontSize: '1.2rem' }}>Ver Revendedores</button>
            </div>
          </div>
        </div>

      </div>
    </AppContext.Provider>
  );
}