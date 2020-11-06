import useResizeObserver from 'use-resize-observer'

import { DflowGraph } from './components/DflowGraph'
import { Logo } from './components/Logo'

export function App() {
  const { ref, width, height } = useResizeObserver()
  const margin = 10

  return (
    <div className='app'>
      <div className='app__nav'>
        <Logo size={17} />
      </div>
      <div ref={ref} className='app__body'>
        <DflowGraph
          position={{ x: margin, y: 0 }}
          dimension={{ width: width - margin * 2, height: height - margin }}
          noFootbar
          noHeadbar
        />
      </div>
    </div>
  )
}
