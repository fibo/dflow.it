import { useRef } from 'react'
import { useFrame } from 'react-three-fiber'

import * as Vector3D from './Vector3D'
import { FlowViewNodeLabel } from '../flow-view'

export const metadata = {
  type: 'Box3D',
  inputs: [
    {
      name: 'position',
      types: ['Vector3D'],
    },
  ],
  outputs: [
    {
      types: ['Node3D'],
    },
  ],
}

export function task([position = Vector3D.task()]) {
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
