import { Canvas } from 'react-three-fiber'

export const metadata = {
  inputs: [
    {
      name: 'children',
      types: ['Group3D', 'Node3D'],
    },
  ],
}

export function task() {}

export function Component({ inputs, useStore }) {
  const Scene3D = inputs[0].data

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      {typeof Scene3D === 'function' && <Scene3D />}
    </Canvas>
  )
}
