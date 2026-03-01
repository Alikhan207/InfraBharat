import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment, Float, Stars, useGLTF, Html } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Droplets } from 'lucide-react';

interface PipeSegment {
  start: [number, number, number];
  end: [number, number, number];
  diameter: number;
  status: 'good' | 'warning' | 'critical';
  flowRate: number; // 0 to 1
}

const pipeSegments: PipeSegment[] = [
  { start: [-5, -1, 0], end: [5, -1, 0], diameter: 0.4, status: 'good', flowRate: 0.8 },
  { start: [5, -1, 0], end: [5, -1, -5], diameter: 0.4, status: 'warning', flowRate: 0.4 },
  { start: [-5, -1, 0], end: [-5, -1, -5], diameter: 0.3, status: 'critical', flowRate: 0.1 },
  { start: [0, -1, 0], end: [0, -1, -5], diameter: 0.35, status: 'good', flowRate: 0.7 },
  { start: [-2, -1, -5], end: [2, -1, -5], diameter: 0.3, status: 'warning', flowRate: 0.5 },
];

function Pipe({ segment, color, rainfall = 50 }: { segment: PipeSegment, color?: string, rainfall?: number }) {
  const [x1, y1, z1] = segment.start;
  const [x2, y2, z2] = segment.end;
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const length = Math.sqrt(
    Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
  );

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const midZ = (z1 + z2) / 2;

  const direction = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1).normalize();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  let currentStatus = segment.status;
  let currentFlow = segment.flowRate;

  // Simulate network load based on rainfall
  if (rainfall > 50) {
    if (segment.status === 'good') {
      currentStatus = rainfall > 130 ? 'critical' : rainfall > 80 ? 'warning' : 'good';
      currentFlow = Math.min(1.0, currentFlow + (rainfall - 50) / 100);
    } else if (segment.status === 'warning') {
      currentStatus = rainfall > 90 ? 'critical' : 'warning';
      currentFlow = Math.min(1.0, currentFlow + (rainfall - 50) / 80);
    } else {
      currentFlow = Math.min(1.0, currentFlow + (rainfall - 50) / 50);
    }
  } else if (rainfall < 50) {
    currentFlow = Math.max(0.05, currentFlow * (rainfall / 50));
    if (segment.status === 'critical' && rainfall < 30) currentStatus = 'warning';
    if (segment.status === 'warning' && rainfall < 20) currentStatus = 'good';
  }

  const baseColor = color || (
    currentStatus === 'good' ? '#22c55e' :
      currentStatus === 'warning' ? '#eab308' :
        '#ef4444');

  useFrame((state) => {
    if (meshRef.current && currentStatus === 'critical') {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.08);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1); // Reset scale
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[midX, midY, midZ]}
        quaternion={quaternion}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[segment.diameter, segment.diameter, length, 32]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : baseColor}
          transparent
          opacity={0.9}
          metalness={0.8}
          roughness={0.2}
          emissive={baseColor}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      {hovered && (
        <Html position={[midX, midY + 1, midZ]}>
          <div className="bg-black/80 border border-slate-700 text-white p-2 rounded text-xs whitespace-nowrap shadow-xl">
            <strong>Network Segment Data</strong><br />
            Status: <span className={currentStatus === 'critical' ? 'text-red-400 font-bold' : currentStatus === 'warning' ? 'text-yellow-400' : 'text-green-400'}>{currentStatus.toUpperCase()}</span><br />
            Flow Capacity: {Math.round(currentFlow * 100)}%
          </div>
        </Html>
      )}
    </group>
  );
}

function Ground({ size = 30 }: { size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      <gridHelper args={[size, size, 0xffffff, 0x444444]} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </mesh>
  );
}

// --- Blueprint Specific Scenes ---

// 1. Manhole & Gully Trap (Enhanced)
function Blueprint1Scene({ rainfall }: { rainfall: number }) {
  return (
    <group>
      {/* Main Manhole Structure */}
      <mesh position={[-3, 0, 0]} castShadow>
        <boxGeometry args={[3, 4, 3]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Text position={[-3, 2.5, 0]} fontSize={0.5} color="white">MH-1</Text>

      {/* Gully Trap */}
      <mesh position={[3, -0.5, 0]} castShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <Text position={[3, 1.5, 0]} fontSize={0.5} color="white">GT-1</Text>

      {/* Secondary Manhole */}
      <mesh position={[-3, 0, 5]} castShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Text position={[-3, 2, 5]} fontSize={0.4} color="white">MH-2</Text>

      {/* Complex Pipe Network */}
      {/* Main connection GT to MH */}
      <Pipe rainfall={rainfall} segment={{ start: [2, -1, 0], end: [-1.5, -1, 0], diameter: 0.3, status: 'good', flowRate: 0.9 }} />

      {/* MH-2 to MH-1 */}
      <Pipe rainfall={rainfall} segment={{ start: [-3, -1, 4], end: [-3, -1, 1.5], diameter: 0.4, status: 'good', flowRate: 0.8 }} />

      {/* Incoming Feeder Pipes */}
      <Pipe rainfall={rainfall} segment={{ start: [6, -0.5, 0], end: [4, -0.5, 0], diameter: 0.2, status: 'good', flowRate: 0.6 }} />
      <Pipe rainfall={rainfall} segment={{ start: [3, -0.5, 3], end: [3, -0.5, 1], diameter: 0.2, status: 'warning', flowRate: 0.4 }} />
      <Pipe rainfall={rainfall} segment={{ start: [3, -0.5, -3], end: [3, -0.5, -1], diameter: 0.2, status: 'good', flowRate: 0.6 }} />

      {/* Outflow from MH-1 */}
      <Pipe rainfall={rainfall} segment={{ start: [-4.5, -1.5, 0], end: [-8, -2, 0], diameter: 0.5, status: 'good', flowRate: 0.95 }} />

      {/* Additional lateral connections */}
      <Pipe rainfall={rainfall} segment={{ start: [-6, -1.8, 2], end: [-6, -1.8, 0], diameter: 0.25, status: 'good', flowRate: 0.5 }} />
      <Pipe rainfall={rainfall} segment={{ start: [-6, -1.8, -2], end: [-6, -1.8, 0], diameter: 0.25, status: 'good', flowRate: 0.5 }} />
    </group>
  );
}

// 2. Complex Site Drainage (Enhanced)
function Blueprint2Scene({ rainfall }: { rainfall: number }) {
  return (
    <group>
      {/* Site Boundaries */}
      <mesh position={[0, 0, -10]} receiveShadow>
        <boxGeometry args={[22, 2, 0.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[-11, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, 2, 0.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Main Arterial Drainage (Red) */}
      <Pipe rainfall={rainfall} segment={{ start: [-9, -2, -8], end: [9, -2, -8], diameter: 0.6, status: 'good', flowRate: 0.9 }} color="#ef4444" />
      <Pipe rainfall={rainfall} segment={{ start: [-9, -2, -8], end: [-9, -2, 8], diameter: 0.6, status: 'good', flowRate: 0.9 }} color="#ef4444" />
      <Pipe rainfall={rainfall} segment={{ start: [-9, -2, 8], end: [9, -2, 8], diameter: 0.6, status: 'good', flowRate: 0.9 }} color="#ef4444" />
      <Pipe rainfall={rainfall} segment={{ start: [9, -2, -8], end: [9, -2, 8], diameter: 0.6, status: 'good', flowRate: 0.9 }} color="#ef4444" />

      {/* Internal Grid (Blue) */}
      {[-4, 0, 4].map((x, i) => (
        <Pipe rainfall={rainfall} key={`v-${i}`} segment={{ start: [x, -1.5, -8], end: [x, -1.5, 8], diameter: 0.3, status: 'good', flowRate: 0.7 }} color="#3b82f6" />
      ))}
      {[-4, 0, 4].map((z, i) => (
        <Pipe rainfall={rainfall} key={`h-${i}`} segment={{ start: [-9, -1.5, z], end: [9, -1.5, z], diameter: 0.3, status: 'good', flowRate: 0.7 }} color="#3b82f6" />
      ))}

      {/* Critical Junctions */}
      <mesh position={[0, -1.5, 0]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color={rainfall > 90 ? "#ef4444" : "#eab308"} />
      </mesh>
      <Pipe rainfall={rainfall} segment={{ start: [0, -1.5, 0], end: [2, -1.5, 2], diameter: 0.2, status: 'critical', flowRate: 0.1 }} />

      {/* Inspection Chambers */}
      <mesh position={[-9, 0, -8]}><cylinderGeometry args={[0.5, 0.5, 2]} /><meshStandardMaterial color="#64748b" /></mesh>
      <mesh position={[9, 0, 8]}><cylinderGeometry args={[0.5, 0.5, 2]} /><meshStandardMaterial color="#64748b" /></mesh>
    </group>
  );
}

// 3. House Plan (Enhanced)
function Blueprint3Scene({ rainfall }: { rainfall: number }) {
  return (
    <group>
      {/* Floor Plan Outline */}
      <group position={[0, -1.9, 0]}>
        <mesh position={[-4, 0.1, -4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6, 6]} /><meshStandardMaterial color="#334155" /></mesh>
        <Text position={[-4, 1, -4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.8} color="white">Kitchen</Text>

        <mesh position={[4, 0.1, -4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[8, 6]} /><meshStandardMaterial color="#334155" /></mesh>
        <Text position={[4, 1, -4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.8} color="white">Bath</Text>

        <mesh position={[0, 0.1, 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 8]} /><meshStandardMaterial color="#334155" /></mesh>
        <Text position={[0, 1, 4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.8} color="white">Living</Text>
      </group>

      {/* Detailed Plumbing */}
      {/* Kitchen Sink Line */}
      <Pipe rainfall={rainfall} segment={{ start: [-5, -1, -5], end: [-5, -2, -5], diameter: 0.15, status: 'good', flowRate: 0.8 }} />
      <Pipe rainfall={rainfall} segment={{ start: [-5, -2, -5], end: [-2, -2.2, -5], diameter: 0.2, status: 'good', flowRate: 0.8 }} />

      {/* Bathroom Lines */}
      <Pipe rainfall={rainfall} segment={{ start: [5, -1, -5], end: [5, -2, -5], diameter: 0.15, status: 'good', flowRate: 0.8 }} /> {/* Basin */}
      <Pipe rainfall={rainfall} segment={{ start: [3, -1, -5], end: [3, -2, -5], diameter: 0.2, status: 'good', flowRate: 0.8 }} /> {/* WC */}
      <Pipe rainfall={rainfall} segment={{ start: [3, -2, -5], end: [5, -2, -5], diameter: 0.25, status: 'good', flowRate: 0.8 }} />

      {/* Main Collection Line */}
      <Pipe rainfall={rainfall} segment={{ start: [-2, -2.2, -5], end: [6, -2.5, -5], diameter: 0.3, status: 'good', flowRate: 0.9 }} />

      {/* Living Area Drainage */}
      <Pipe rainfall={rainfall} segment={{ start: [-6, -2.5, 4], end: [6, -2.5, 4], diameter: 0.3, status: 'warning', flowRate: 0.5 }} />

      {/* Connection to Main Sewer */}
      <Pipe rainfall={rainfall} segment={{ start: [6, -2.5, -5], end: [6, -2.5, 4], diameter: 0.4, status: 'good', flowRate: 0.9 }} />
      <Pipe rainfall={rainfall} segment={{ start: [6, -2.5, 4], end: [8, -3, 6], diameter: 0.5, status: 'good', flowRate: 0.9 }} />

      {/* Vent Pipes */}
      <mesh position={[6, 2, -5]}><cylinderGeometry args={[0.1, 0.1, 4]} /><meshStandardMaterial color="#22c55e" /></mesh>
    </group>
  );
}

// 4. Large Hall / Columns (Enhanced)
function Blueprint4Scene({ rainfall }: { rainfall: number }) {
  const columns = [];
  for (let x = -8; x <= 8; x += 4) {
    for (let z = -6; z <= 6; z += 4) {
      columns.push(
        <mesh key={`${x}-${z}`} position={[x, 0, z]} castShadow>
          <boxGeometry args={[0.8, 4, 0.8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      );
    }
  }

  return (
    <group>
      {columns}
      {/* Perimeter Drainage System */}
      <Pipe rainfall={rainfall} segment={{ start: [-9, -2, -7], end: [9, -2, -7], diameter: 0.4, status: 'good', flowRate: 0.8 }} />
      <Pipe rainfall={rainfall} segment={{ start: [9, -2, -7], end: [9, -2, 7], diameter: 0.4, status: 'good', flowRate: 0.8 }} />
      <Pipe rainfall={rainfall} segment={{ start: [9, -2, 7], end: [-9, -2, 7], diameter: 0.4, status: 'warning', flowRate: 0.5 }} />
      <Pipe rainfall={rainfall} segment={{ start: [-9, -2, 7], end: [-9, -2, -7], diameter: 0.4, status: 'good', flowRate: 0.8 }} />

      {/* Central Cross Drains */}
      <Pipe rainfall={rainfall} segment={{ start: [-9, -2, 0], end: [9, -2, 0], diameter: 0.3, status: 'good', flowRate: 0.7 }} />
      <Pipe rainfall={rainfall} segment={{ start: [0, -2, -7], end: [0, -2, 7], diameter: 0.3, status: 'good', flowRate: 0.7 }} />

      {/* Diagonal Feeder Lines */}
      <Pipe rainfall={rainfall} segment={{ start: [-5, -2, -4], end: [0, -2, 0], diameter: 0.2, status: 'good', flowRate: 0.6 }} />
      <Pipe rainfall={rainfall} segment={{ start: [5, -2, -4], end: [0, -2, 0], diameter: 0.2, status: 'good', flowRate: 0.6 }} />
      <Pipe rainfall={rainfall} segment={{ start: [-5, -2, 4], end: [0, -2, 0], diameter: 0.2, status: 'good', flowRate: 0.6 }} />
      <Pipe rainfall={rainfall} segment={{ start: [5, -2, 4], end: [0, -2, 0], diameter: 0.2, status: 'good', flowRate: 0.6 }} />

      {/* Outflow */}
      <Pipe rainfall={rainfall} segment={{ start: [9, -2, 0], end: [12, -3, 0], diameter: 0.5, status: 'good', flowRate: 0.9 }} />
    </group>
  );
}

function DefaultScene({ rainfall }: { rainfall: number }) {
  return (
    <>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[-4, 1, -4]} castShadow receiveShadow>
          <boxGeometry args={[2, 6, 2]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh position={[4, 2, -4]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 8, 2.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={2.5} rotationIntensity={0.05} floatIntensity={0.1}>
        <mesh position={[0, 0.5, 4]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 2]} />
          <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.3} />
        </mesh>
      </Float>
      {pipeSegments.map((segment, index) => (
        <Pipe rainfall={rainfall} key={index} segment={segment} />
      ))}
      <Text
        position={[0, 4, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Underground Drainage Network
      </Text>
    </>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={2} position={[0, 0, 0]} />;
}

export function DrainageVisualization3D({ modelUrl }: { modelUrl?: string }) {
  // Check if modelUrl is a special "blueprint-X" string
  const blueprintType = modelUrl?.startsWith('blueprint-') ? modelUrl : null;
  const isRealUrl = modelUrl && !blueprintType;

  const [rainfall, setRainfall] = useState(50);

  return (
    <Card className="w-full flex flex-col h-[700px] overflow-hidden bg-slate-950 border-slate-800 relative shadow-2xl">
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          <span className="text-white font-semibold flex items-center gap-2 flex-shrink-0">
            <div className="bg-blue-500/20 p-1.5 rounded-lg"><Droplets className="h-4 w-4 text-blue-400" /></div>
            Cascade Simulation
          </span>
          <div className="flex items-center gap-4 bg-slate-800/50 p-2.5 rounded-xl flex-grow max-w-xl">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Rainfall Simulator</span>
            <input
              type="range"
              min="0"
              max="150"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
            />
            <span className="text-sm font-semibold text-blue-300 font-mono w-20 flex-shrink-0 bg-slate-900 px-2 py-1 rounded text-center border border-blue-500/20">
              {rainfall} <span className="text-[10px] text-slate-500">mm/hr</span>
            </span>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border hidden md:flex">
            {rainfall > 110 ? <span className="text-red-400 flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Critical Overflow Alert</span> :
              rainfall > 70 ? <span className="text-yellow-400 flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Warning: Load {rainfall}%</span> :
                <span className="text-green-400 flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Stable Flow</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[10, 12, 10]} fov={50} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.5}
          />

          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="city" />

          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" />

          <Ground />

          <Suspense fallback={null}>
            {isRealUrl ? (
              <Model url={modelUrl!} />
            ) : blueprintType === 'blueprint-1' ? (
              <Blueprint1Scene rainfall={rainfall} />
            ) : blueprintType === 'blueprint-2' ? (
              <Blueprint2Scene rainfall={rainfall} />
            ) : blueprintType === 'blueprint-3' ? (
              <Blueprint3Scene rainfall={rainfall} />
            ) : blueprintType === 'blueprint-4' ? (
              <Blueprint4Scene rainfall={rainfall} />
            ) : (
              <DefaultScene rainfall={rainfall} />
            )}
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 p-4 rounded-lg backdrop-blur-sm text-white border border-white/10">
        <h3 className="font-bold mb-2">Network Status</h3>
        {modelUrl ? (
          <div className="flex items-center gap-2 text-sm mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
            <span>Simulation Active: {blueprintType ? blueprintType.replace('blueprint-', 'Blueprint ') : 'Imported Model'}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
              <span>Optimal Flow (95%)</span>
            </div>
            <div className="flex items-center gap-2 text-sm mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]"></div>
              <span>Restricted (40%)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"></div>
              <span>Critical Blockage (10%)</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
