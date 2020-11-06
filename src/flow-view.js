const origin = { x: 0, y: 0 }

export function FlowViewNode({
  children,
  noFootbar = false,
  noHeadbar = false,
  position = origin,
  dimension,
}) {
  return (
    <div
      className='flow-view-node'
      style={{ ...dimension, top: position.y, left: position.x }}
    >
      {noHeadbar || <div className='flow-view-node__headbar' />}

      <div className='flow-view-node__body'>{children}</div>

      {noFootbar || <div className='flow-view-node__footbar' />}
    </div>
  )
}

export function FlowViewCanvas({ nodes = [], ...props }) {
  return (
    <FlowViewNode {...props}>
      {nodes.map((node, i) => (
        <FlowViewNode key={i} {...node} />
      ))}
    </FlowViewNode>
  )
}
