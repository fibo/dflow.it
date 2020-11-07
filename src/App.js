import { useState } from 'react'
import useResizeObserver from 'use-resize-observer'

import { DflowGraph } from './components/DflowGraph'
import { Logo } from './components/Logo'

export function App() {
  const [viewGraph, setViewGraph] = useState({
    nodes: [
      {
        id: 1,
        parentId: 0,
        position: { x: 10, y: 10 },
        dimension: { width: 100, height: 100 },
      },
      {
        id: 2,
        hasChildren: true,
        parentId: 0,
        position: { x: 200, y: 10 },
        dimension: { width: 400, height: 400 },
      },
      {
        parentId: 2,
        id: 3,
        position: { x: 10, y: 10 },
        dimension: { width: 40, height: 40 },
      },
      {
        parentId: 2,
        id: 4,
        position: { x: 20, y: 20 },
        dimension: { width: 40, height: 40 },
      },
    ],
  })
  const { ref, width, height } = useResizeObserver()
  const margin = 10

  return (
    <div className='app'>
      <div className='app__nav'>
        <Logo size={17} />
      </div>
      <div ref={ref} className='app__body'>
        {width && height && (
          <DflowGraph
            position={{ x: margin, y: 0 }}
            dimension={{ width: width - margin * 2, height: height - margin }}
            noFootbar
            noHeadbar
            viewGraph={viewGraph}
            setViewGraph={setViewGraph}
          />
        )}
      </div>
    </div>
  )
}
