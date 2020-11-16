import { useEffect, useState } from 'react'
import { animated, useSpring } from 'react-spring'
import useResizeObserver from 'use-resize-observer'

import { dflowFun } from './dflow'
import { createFlowViewStore, FlowViewNode } from './flow-view'
import { Logo } from './components/Logo'
import { componentMap, taskMap } from './nodes'

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

  const appendGraph = flowViewStore((state) => state.appendGraph)
  const iteration = flowViewStore((state) => state.iteration)
  const updateGraph = flowViewStore((state) => state.updateGraph)
  const setRootDimension = flowViewStore((state) => state.setRootDimension)
  const setRootPosition = flowViewStore((state) => state.setRootPosition)

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
  }, [iteration, updateGraph])

  useEffect(() => {
    appendGraph({
      next: true,
      nodes: [
        {
          id: 1,
          containerId: 0,
          Component: componentMap.get('Markdown'),
          type: 'Markdown',
          inputs: [
            {
              data: ['# dflow', '> Dataflow programming'],
              types: ['string[]'],
            },
          ],
          outputs: [],
          position: { x: 10, y: 10 },
          dimension: { width: 150, height: 400 },
        },
        {
          id: 2,
          isContainer: true,
          containerId: 0,
          inputs: [],
          outputs: [],
          position: { x: 200, y: 10 },
          dimension: { width: 200, height: 400 },
        },
        {
          containerId: 2,
          id: 3,
          position: { x: 20, y: 10 },
          dimension: { width: 100, height: 40 },
          Component: componentMap.get('IONumber'),
          type: 'IONumber',
          text: '1',
          inputs: [{ types: ['number', 'string'], data: 1 }],
          outputs: [{ types: ['number'] }],
        },
        {
          containerId: 2,
          id: 4,
          Component: componentMap.get('Addition'),
          comment: 'add',
          position: { x: 10, y: 70 },
          dimension: { width: 100, height: 40 },
          type: 'Addition',
          label: '+',
          inputs: [
            { types: ['number', 'string'] },
            { types: ['number', 'string'] },
          ],
          outputs: [{ types: ['number'] }],
        },
        {
          containerId: 0,
          id: 7,
          Component: componentMap.get('Vector3D'),
          position: { x: 450, y: 50 },
          dimension: { width: 100, height: 40 },
          label: 'Vector3D',
          type: 'Vector3D',
          inputs: [],
          outputs: [],
        },
        {
          containerId: 0,
          id: 8,
          Component: componentMap.get('Box3D'),
          position: { x: 450, y: 120 },
          dimension: { width: 100, height: 40 },
          label: 'Box3D',
          type: 'Box3D',
          inputs: [{ types: ['Vector3D'] }],
          outputs: [{ types: ['Node3D'] }],
        },
        {
          containerId: 0,
          id: 9,
          Component: componentMap.get('Canvas3D'),
          position: { x: 450, y: 200 },
          dimension: { width: 400, height: 400 },
          type: 'Canvas3D',
          inputs: [{ types: ['Group3D', 'Node3D'] }],
          outputs: [],
        },
      ],
      pipes: [
        {
          containerId: 2,
          id: 21,
          source: [3, 0],
          target: [4, 0],
        },
        {
          containerId: 2,
          id: 22,
          source: [3, 0],
          target: [4, 1],
        },
        {
          containerId: 0,
          id: 23,
          source: [8, 0],
          target: [9, 0],
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
        <AnimatedLogo size={spring.size.interpolate((n) => parseInt(n))} />
      </div>
      <div ref={ref} className='app__body'>
        {width && height && <FlowViewNode useStore={flowViewStore} />}
      </div>
    </div>
  )
}
