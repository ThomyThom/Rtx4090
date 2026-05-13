import { useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Float, Sparkles } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// COMPONENTE DA PLACA DE VÍDEO (3D)
// ==========================================
function GpuModel() {
  const { scene } = useGLTF('/geforce_rtx_4090_founders_edition.glb'); 
  const gpuRef = useRef();

  useLayoutEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#main-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Scrub maior deixa o movimento mais "amanteigado" e pesado
      }
    });

    // ESTADO 1 PARA ESTADO 2 (Move da Direita para a Esquerda e mostra as ventoinhas)
    tl.to(gpuRef.current.position, { x: -2, y: -0.5, z: 1 }, 0);
    tl.to(gpuRef.current.rotation, { x: Math.PI / 8, y: Math.PI / 4, z: -0.1 }, 0);

    // ESTADO 2 PARA ESTADO 3 (Centraliza, dá um zoom agressivo e gira)
    tl.to(gpuRef.current.position, { x: 0, y: 0, z: 2 }, 1);
    tl.to(gpuRef.current.rotation, { x: -Math.PI / 12, y: -Math.PI, z: 0 }, 1);
  }, []);

  return (
    <group ref={gpuRef} 
      // POSIÇÃO E ROTAÇÃO INICIAL (A Diagonal agressiva da foto da NVIDIA)
      // Ajustamos o eixo para ela deitar e ficar angulada.
      position={[2, 0, 0]} 
      rotation={[0.4, -0.6, 0.2]} 
    >
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <primitive object={scene} scale={0.012} />
      </Float>
    </group>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (SITE COMPLETO)
// ==========================================
export default function App() {
  return (
    <div id="main-wrapper" style={{ backgroundColor: '#050505', color: 'white', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* CSS GLOBAL: Reset, Tipografia e Barras de Rolagem */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;800&display=swap');
        body, html { margin: 0; padding: 0; overflow-x: hidden; background: #050505; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #76b900; border-radius: 5px; }
        
        .nav-bar { position: fixed; top: 0; width: 100%; padding: 20px 50px; display: flex; justify-content: space-between; z-index: 10; box-sizing: border-box; mix-blend-mode: difference; }
        .nav-logo { font-weight: 800; font-size: 1.5rem; letter-spacing: 2px; }
        .nav-links { display: flex; gap: 30px; font-weight: 500; font-size: 0.9rem; color: #aaa; }
        
        .section { height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 0 10vw; box-sizing: border-box; position: relative; z-index: 2; pointer-events: none; }
        
        .glass-box { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); max-width: 500px; pointer-events: auto; }
        
        h1 { font-size: 4.5rem; font-weight: 800; margin: 0; line-height: 1.1; letter-spacing: -2px; }
        .text-green { color: #76b900; text-shadow: 0 0 20px rgba(118,185,0,0.5); }
        p { font-size: 1.2rem; color: #888; font-weight: 300; line-height: 1.6; margin-top: 20px; }
        
        button { margin-top: 30px; padding: 15px 30px; background: #76b900; color: #000; font-weight: 800; font-size: 1rem; border: none; border-radius: 8px; cursor: pointer; transition: 0.3s; pointer-events: auto; }
        button:hover { background: #8deb00; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(118,185,0,0.3); }
      `}</style>

      {/* HEADER VISUAL (Para dar cara de site real) */}
      <nav className="nav-bar">
        <div className="nav-logo">GEFORCE<span className="text-green">.</span></div>
        <div className="nav-links">
          <span>Arquitetura Ada</span>
          <span>Ray Tracing</span>
          <span>Comprar</span>
        </div>
      </nav>

      {/* CANVAS 3D (Fixo no fundo) */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}>
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
          
          {/* Iluminação Cinematográfica */}
          <Environment preset="studio" />
          <ambientLight intensity={0.2} />
          {/* Luz principal cortando de cima */}
          <spotLight position={[5, 10, 5]} intensity={2.5} angle={0.5} penumbra={1} color="#ffffff" />
          {/* Luz de preenchimento da marca (Verde NVIDIA) vindo de baixo */}
          <spotLight position={[-5, -5, -5]} intensity={4} angle={0.8} penumbra={1} color="#76b900" />
          
          {/* Sombra de contato no "chão" invisível */}
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} />
          
          {/* Efeito de partículas de energia no ar */}
          <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.3} color="#76b900" />
          <Sparkles count={100} scale={10} size={1} speed={0.2} opacity={0.1} color="#ffffff" />

          <Suspense fallback={null}>
            <GpuModel />
          </Suspense>
        </Canvas>
      </div>

      {/* SEÇÃO 1: HERO (Introdução) */}
      <section className="section" style={{ alignItems: 'flex-start' }}>
        <div className="glass-box">
          <h2 style={{ fontSize: '1rem', color: '#76b900', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>Beyond Fast</h2>
          <h1>A Placa Definitiva.</h1>
          <p>Prepare-se para o ápice do design térmico e da potência gráfica. A GeForce RTX 4090 muda as regras do jogo e da criação de conteúdo.</p>
        </div>
      </section>

      {/* SEÇÃO 2: REFRIGERAÇÃO E DESIGN (Direita) */}
      <section className="section" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
        <div className="glass-box" style={{ background: 'transparent', border: 'none', textAlign: 'right' }}>
          <h1 style={{ fontSize: '3.5rem' }}>Design Térmico <br/><span className="text-green">Absoluto.</span></h1>
          <p>Ventoinhas duplas de fluxo axial maiores. Câmara de vapor otimizada. Dissipação de calor revolucionária para manter o poder máximo em silêncio.</p>
        </div>
      </section>

      {/* SEÇÃO 3: CALL TO ACTION (Centro) */}
      <section className="section" style={{ alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: '5rem', textShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          RTX <span className="text-green">4090</span>
        </h1>
        <p style={{ maxWidth: '600px', margin: '20px auto', color: '#fff' }}>O futuro do Ray Tracing e gráficos impulsionados por Inteligência Artificial está nas suas mãos.</p>
        <button>Garantir a Minha</button>
      </section>

    </div>
  );
}