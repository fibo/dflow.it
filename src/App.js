import { useEffect } from 'react'
import useResizeObserver from 'use-resize-observer'

import { Logo } from './components/Logo'

import { createFlowViewStore, FlowViewNode } from './flow-view'

export function App() {
  const { ref, width, height } = useResizeObserver()
  const margin = 10

  const flowViewStore = createFlowViewStore({
    nodes: [
      {
        id: 1,
        renderBody: () => <div>Hello</div>,
        position: { x: 10, y: 10 },
        dimension: { width: 100, height: 100 },
      },
      {
        id: 2,
        isContainer: true,
        position: { x: 200, y: 10 },
        dimension: { width: 400, height: 400 },
      },
      {
        containerId: 2,
        id: 3,
        position: { x: 100, y: 10 },
        dimension: { width: 40, height: 40 },
        text: '1',
        outputs: [{ types: ['number'] }],
      },
      {
        containerId: 2,
        id: 4,
        position: { x: 100, y: 70 },
        dimension: { width: 40, height: 40 },
        text: '+',
        inputs: [{ types: ['number'] }, { types: ['number'] }],
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

  const setRootDimension = flowViewStore((state) => state.setRootDimension)
  const setRootPosition = flowViewStore((state) => state.setRootPosition)

  useEffect(() => {
    if (typeof width === 'number' && typeof height === 'number') {
      setRootDimension({ width, height })
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
