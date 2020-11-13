import { useEffect, useState } from 'react'
import { animated, useSpring } from 'react-spring'
import useResizeObserver from 'use-resize-observer'

import { dflowFun } from './dflow'
import {
  createFlowViewStore,
  flowViewGraphTopologyFingerprint,
  FlowViewNode,
} from './flow-view'
import { Logo } from './components/Logo'
import { taskMap } from './nodes'

const AnimatedLogo = animated(Logo)

const flowViewStore = createFlowViewStore()
const initialLogoSize = 17

export function App() {
  const { ref, width, height } = useResizeObserver()
  const margin = 10

  const [enterMenu, setEnterMenu] = useState(false)
  const spring = useSpring({
    size: enterMenu ? initialLogoSize * 10 : initialLogoSize,
    from: { size: initialLogoSize },
    config: {
      mass: 1,
      tension: 170,
      friction: 17,
    },
  })

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

    const tasks = nodes.filter(({ isContainer }) => isContainer !== true)

    const { errorMap, outputMap } = dflowFun(
      {
        nodes: tasks.map(({ id, type, inputs }) => ({
          id,
          type,
          inputs,
        })),
        pipes: pipes.map(({ id, source, target }) => ({ id, source, target })),
      },
      taskMap
    )

    updateGraph({
      nodes: tasks.map(({ id, outputs: [output], ...node }) => ({
        ...node,
        id,
        error: errorMap.get(id),
        outputs: output ? [{ ...output, data: outputMap.get(id) }] : [],
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
          type: 'Markdown',
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
          target: [4, 1],
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
      <div
        className='app__nav'
        onMouseEnter={() => {
          setEnterMenu(true)
        }}
        onMouseLeave={() => {
          setEnterMenu(false)
        }}
      >
        <AnimatedLogo size={spring.size} />
      </div>
      <div ref={ref} className='app__body'>
        {width && height && <FlowViewNode useStore={flowViewStore} />}
      </div>
    </div>
  )
}
