import { useRef } from 'react'
import { useFrame } from 'react-three-fiber'
import { Vector3 } from 'three'

import { FlowViewNodeLabel } from '../flow-view'

export const metadata = {
  type: 'Box3D',
  inputs: [
    // default: new Vector3(0, 0, 0),
    // name: 'position'
    // types: ['Vector3D']
  ],
  outputs: [
    {
      types: ['Node3D'],
    },
  ],
}

export function task() {
  const position = new Vector3(0, 0, 0)

  return function Box3D() {
    const mesh = useRef()

    useFrame(() => {
      mesh.current.rotation.x = mesh.current.rotation.y += 0.01
    })

    return (
      <mesh ref={mesh} position={position} scale={[1, 1, 1]}>
        <boxBufferGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color='orange' />
      </mesh>
    )
  }
}

export const Component = FlowViewNodeLabel
