import { FlowViewNodeLabel } from '../flow-view'

export const metadata = {
  label: '+',
  inputs: [
    {
      num: 2,
      types: ['number', 'string'],
    },
  ],
  outputs: [
    {
      types: ['number'],
    },
  ],
}

export function task([a, b]) {
  return a + b
}

export const Component = FlowViewNodeLabel
