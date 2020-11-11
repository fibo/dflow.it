import { useEffect, useState } from 'react'
import useResizeObserver from 'use-resize-observer'

import { dflowFun } from './dflow'
import {
  createFlowViewStore,
  flowViewGraphTopologyFingerprint,
  notFlowViewRoot,
  FlowViewNode,
} from './flow-view'
import { Logo } from './components/Logo'
import * as Addition from './nodes/Addition'
import * as IONumber from './nodes/IONumber'

const flowViewStore = createFlowViewStore()

const taskMap = new Map()

taskMap.set('Addition', Addition.task)
taskMap.set('IONumber', IONumber.task)

export function App() {
  const { ref, width, height } = useResizeObserver()
  const margin = 10

  const [graphTopologyFingerprint, setGraphTopologyFingerprint] = useState('')
  const appendGraph = flowViewStore((state) => state.appendGraph)
  const updateGraph = flowViewStore((state) => state.updateGraph)
  const setRootDimension = flowViewStore((state) => state.setRootDimension)
  const setRootPosition = flowViewStore((state) => state.setRootPosition)

  useEffect(() => {
    flowViewStore.subscribe((state) => {
      setGraphTopologyFingerprint(flowViewGraphTopologyFingerprint(state))
    })
  }, [])

  useEffect(() => {
    // TODO remove containers and reduce pipes
    const { nodes, pipes } = flowViewStore.getState()

    const { errorMap /*, outputMap*/ } = dflowFun(
      {
        nodes: nodes.filter(notFlowViewRoot).map(({ id, type, inputs }) => ({
          id,
          type,
          inputs: inputs.map(({ data }) => data),
        })),
        pipes: pipes.map(({ id, source, target }) => ({ id, source, target })),
      },
      taskMap
    )

    updateGraph({
      nodes: nodes.map(({ id, outputs, ...node }) => ({
        error: errorMap.get(id),
        // outputs: [...outputs[0], outputMap.get(id)],
      })),
    })
  }, [graphTopologyFingerprint, updateGraph])

  useEffect(() => {
    appendGraph({
      nodes: [
        {
          id: 1,
          containerId: 0,
          renderBody: () => <div>Hello</div>,
          error: 'Opsss',
          inputs: [],
          outputs: [],
          position: { x: 10, y: 10 },
          dimension: { width: 100, height: 100 },
        },
        {
          id: 2,
          isContainer: true,
          containerId: 0,
          inputs: [],
          outputs: [],
          position: { x: 200, y: 10 },
          dimension: { width: 400, height: 400 },
        },
        {
          containerId: 2,
          id: 3,
          position: { x: 100, y: 10 },
          dimension: { width: 40, height: 40 },
          type: 'IONumber',
          text: '1',
          inputs: [{ types: ['number', 'string'], data: 1 }],
          outputs: [{ types: ['number'] }],
        },
        {
          containerId: 2,
          id: 4,
          position: { x: 100, y: 70 },
          dimension: { width: 40, height: 40 },
          type: 'Addition',
          text: '+',
          inputs: [
            { types: ['number', 'string'] },
            { types: ['number', 'string'] },
          ],
          outputs: [{ types: ['number'] }],
        },
      ],
      pipes: [
        {
          containerId: 2,
          id: 5,
          source: [3, 0],
          target: [4, 0],
        },
        {
          containerId: 2,
          id: 6,
          source: [3, 0],
          target: [4, 0],
        },
      ],
    })
  }, [appendGraph])

  useEffect(() => {
    if (typeof width === 'number' && typeof height === 'number') {
      setRootDimension({ width: width - margin * 2, height: height - margin })
    }
  }, [width, height, setRootDimension])

  useEffect(() => {
    setRootPosition({ x: margin, y: 0 })
  }, [margin, setRootPosition])

  return (
    <div className='app'>
      <div className='app__nav'>
        <Logo size={17} />
      </div>
      <div ref={ref} className='app__body'>
        {width && height && <FlowViewNode useStore={flowViewStore} />}
      </div>
    </div>
  )
}
