import React from 'react'

const origin = { x: 0, y: 0 }

export function FlowViewNode ({ children, position = origin, dimension }) {
  return <div className='flow-view-node' style={{...dimension, top: position.y, left: position.x}}>{children}</div>
}

export function FlowViewCanvas (props) {
  return <FlowViewNode {...props} />
}
