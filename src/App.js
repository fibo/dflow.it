import useResizeObserver from 'use-resize-observer'

import { DflowGraph } from './components/DflowGraph'
import { Logo } from './components/Logo'

export function App() {
  const { ref, width, height } = useResizeObserver()

  return (
    <div className='app'>
      <div className='app__nav'>
        <Logo size={17} />
      </div>
      <div ref={ref} className='app__body'>
        <DflowGraph dimension={{ width, height }} />
      </div>
    </div>
  )
}
