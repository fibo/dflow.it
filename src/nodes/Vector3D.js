import { FlowViewNodeLabel } from 'flow-view'
import { Vector3 } from 'three'

export const metadata = {
  inputs: [
    {
      name: 'coordinate',
      num: 3,
      types: ['number'],
    },
  ],
  outputs: [
    {
      types: ['Vector3D'],
    },
  ],
}

export function task([x, y, z] = []) {
  return new Vector3(x, y, z)
}

export const Component = FlowViewNodeLabel
