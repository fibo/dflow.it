import classnames from 'classnames'
import { useCallback, useState } from 'react'

const origin = { x: 0, y: 0 }

export function FlowViewNode({
  children,
  id,
  parentId,
  noFootbar = false,
  noHeadbar = false,
  onClick,
  position = origin,
  dimension,
  selected = false,
  setSelected,
}) {
  return (
    <div
      className={classnames('flow-view-node', {
        'flow-view-node--selected': selected,
      })}
      onClick={(event) => {
        event.stopPropagation()

        setSelected(id, !selected)
      }}
      style={{ ...dimension, top: position.y, left: position.x }}
    >
      {noHeadbar || <div className='flow-view-node__headbar' />}

      <div className='flow-view-node__body'>{children}</div>

      {noFootbar || <div className='flow-view-node__footbar' />}
    </div>
  )
}

export function FlowViewCanvas({
  id,
  parentId,
  graph: { nodes } = { nodes: [] },
  selected,
  setSelected = () => {},
  setGraph,
  ...props
}) {
  const [selectedNodeIds, setSelectedNodeIds] = useState([])

  const setSelectedNode = useCallback(
    (selectedId, selected) => {
      if (selected) {
        setSelectedNodeIds(selectedNodeIds.concat(selectedId))
      } else {
        setSelectedNodeIds(selectedNodeIds.filter((id) => id !== selectedId))
      }
    },
    [selectedNodeIds, setSelectedNodeIds]
  )

  return (
    <FlowViewNode
      id={id}
      parentId={parentId}
      selected={selected}
      setSelected={setSelected}
      {...props}
    >
      {nodes
        .filter((node) => node.parentId === id)
        .map(({ id: childId, hasChildren, ...props }, i) => {
          const childIsSelected = selectedNodeIds.includes(childId)

          return hasChildren ? (
            <FlowViewCanvas
              key={i}
              id={childId}
              parentId={id}
              graph={{
                nodes: nodes.filter((node) => node.parentId === childId),
              }}
              setGraph={(graph) => {
                setGraph({
                  nodes: nodes.map((node) => (node.id === id ? graph : node)),
                })
              }}
              selected={childIsSelected}
              setSelected={setSelectedNode}
              {...props}
            />
          ) : (
            <FlowViewNode
              key={i}
              id={childId}
              parentId={id}
              {...props}
              selected={childIsSelected}
              setSelected={setSelectedNode}
            />
          )
        })}
    </FlowViewNode>
  )
}
