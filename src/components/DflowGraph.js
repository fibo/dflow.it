import { FlowViewCanvas } from '../flow-view'

const rootId = 0

export function DflowGraph({ id = rootId, setViewGraph, viewGraph, ...props }) {
  return (
    <FlowViewCanvas
      id={id}
      graph={viewGraph}
      setGraph={setViewGraph}
      {...props}
    />
  )
}
