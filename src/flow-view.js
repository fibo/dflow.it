import classnames from 'classnames'
import { useEffect, useState, useRef } from 'react'
import zustand from 'zustand'

const rootId = 0

const toId = ({ id }) => id
const isSelected = ({ selected }) => selected

const getNodeById = (nodeId) => (state) =>
  state.nodes.find(({ id }) => id === nodeId)

const getChildrenNodes = (id) => (state) =>
  id === rootId
    ? state.nodes.filter(
        ({ id: childId, parentId }) =>
          childId !== rootId &&
          (parentId === rootId || typeof parentId === 'undefined')
      )
    : state.nodes.filter(({ parentId }) => id === parentId)

const getChildrenPipes = (id) => (state) =>
  state.pipes.filter(({ parentId }) =>
    id === rootId
      ? parentId === rootId || typeof parentId === 'undefined'
      : id === parentId
  )

const getDescendantNodes = (id) => (state) =>
  getChildrenNodes(id)(state).reduce(
    (descendants, node) =>
      descendants.concat(node).concat(getDescendantNodes(node.id)(state)),
    []
  )

const getDescendantNodeIds = (id) => (state) =>
  getDescendantNodes(id)(state).map(toId)

const getSelectedNodes = (state) => state.nodes.filter(isSelected)

const getSelectedNodeIds = (state) => getSelectedNodes(state).map(toId)

const getSomeDescendantNodeIsSelected = (id) => (state) =>
  getDescendantNodes(id)(state).some(isSelected)

const getIsContainer = (id) => (state) =>
  id === rootId || getNodeById(id)(state)?.isContainer === true

function FlowViewContainerBody({ id, useStore, width, height }) {
  const childrenNodes = useStore(getChildrenNodes(id))
  const childrenPipes = useStore(getChildrenPipes(id))

  return (
    <>
      {childrenNodes.map((props, i) => (
        <FlowViewNode key={i} useStore={useStore} {...props} />
      ))}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {childrenPipes.map((props, i) => (
          <FlowPipePipe key={i} useStore={useStore} {...props} />
        ))}
      </svg>
    </>
  )
}

const getRenderBody = (id) => (state) => {
  const node = getNodeById(id)(state)

  const hasRenderBody = typeof node.renderBody === 'function'
  const hasText = typeof node.text === 'string'
  const isContainer = getIsContainer(id)(state)

  switch (true) {
    case hasRenderBody:
      return node.renderBody

    case isContainer:
      return (props) => <FlowViewContainerBody {...props} />

    case hasText:
      return () => (
        <div className='flow-view-node__label'>
          <span>{node.text}</span>
        </div>
      )

    default:
      return () => null
  }
}

export const createFlowViewStore = ({ nodes, pipes }) =>
  zustand((set) => ({
    nextId: rootId + 1,
    nodes,
    pipes,
    setSelectedNodes: (nodeIds, selected) =>
      set((state) => ({
        // 1. First remove the `selected` attribute from nodes that are not involved.
        nodes: state.nodes
          .filter(({ id }) => !nodeIds.includes(id))
          .map(({ selected, ...node }) => node)
          .concat(
            // 2. Then move selected nodes to the end of the list in order to paint them on top.
            state.nodes
              .filter(({ id }) => nodeIds.includes(id))
              .map((node) => ({ ...node, selected }))
          ),
      })),
    setStartDraggingPoint: (startDraggingPoint) =>
      set((state) => ({ startDraggingPoint })),
    translateNodes: (nodeIds, draggingDelta) =>
      set((state) => ({
        nodes: state.nodes.map(({ id, position, ...node }) =>
          nodeIds.includes(id)
            ? {
                ...node,
                id,
                position: {
                  x: position.x + draggingDelta.x,
                  y: position.y + draggingDelta.y,
                },
              }
            : { ...node, id, position }
        ),
      })),
  }))

export function FlowViewNode({ id = rootId, parentId = rootId, useStore }) {
  const isRoot = id === rootId

  const [headbarHeight, setHeadbarHeight] = useState(0)
  const [footbarHeight, setFootbarHeight] = useState(0)

  const footbarRef = useRef()
  const headbarRef = useRef()

  useEffect(() => {
    if (headbarRef.current) {
      const { height } = headbarRef.current.getBoundingClientRect()

      setHeadbarHeight(height)
    }
  }, [headbarRef, setHeadbarHeight])

  useEffect(() => {
    if (footbarRef.current) {
      const { height } = footbarRef.current.getBoundingClientRect()

      setFootbarHeight(height)
    }
  }, [footbarRef, setFootbarHeight])

  const {
    dimension,
    position,
    inputs = [],
    noFootbar,
    noHeadbar,
    outputs = [],
    selected,
  } = useStore(getNodeById(id))
  const descendantNodeIds = useStore(getDescendantNodeIds(id))
  const someDescendantNodeIsSelected = useStore(
    getSomeDescendantNodeIsSelected(id)
  )
  const isContainer = useStore(getIsContainer(id))
  const renderBody = useStore(getRenderBody(id))
  const selectedNodesIds = useStore(getSelectedNodeIds)
  const setSelectedNodes = useStore((state) => state.setSelectedNodes)
  const setStartDraggingPoint = useStore((state) => state.setStartDraggingPoint)
  const startDraggingPoint = useStore((state) => state.startDraggingPoint)
  const translateNodes = useStore((state) => state.translateNodes)

  return (
    <div
      className={classnames('flow-view-node', {
        'flow-view-node--selected': selected,
      })}
      onClick={(event) => {
        event.stopPropagation()
      }}
      onMouseDown={(event) => {
        event.stopPropagation()

        setStartDraggingPoint({ x: event.clientX, y: event.clientY })

        if (isRoot) {
          setSelectedNodes(descendantNodeIds, false)
        } else {
          setSelectedNodes(selectedNodesIds, false)

          setSelectedNodes([id], true)
        }
      }}
      onMouseLeave={() => {
        if (isContainer) {
          setStartDraggingPoint()
        }
      }}
      onMouseMove={(event) => {
        if (isContainer) {
          event.stopPropagation()

          if (startDraggingPoint) {
            const { clientX: x, clientY: y } = event

            translateNodes(selectedNodesIds, {
              x: x - startDraggingPoint.x,
              y: y - startDraggingPoint.y,
            })
            setStartDraggingPoint({ x, y })
          }
        }
      }}
      onMouseUp={(event) => {
        event.stopPropagation()

        setStartDraggingPoint()
      }}
      style={{ ...dimension, top: position.y, left: position.x }}
    >
      {noHeadbar || (
        <div ref={headbarRef} className='flow-view-node__headbar'>
          {inputs.map((props, i) => (
            <FlowViewInput key={i} {...props} />
          ))}
        </div>
      )}

      <div
        className='flow-view-node__body'
        onMouseDown={(event) => {
          if (isRoot) return

          if (isContainer) {
            if (selected) {
            } else {
              event.stopPropagation()

              if (someDescendantNodeIsSelected) {
                setSelectedNodes(descendantNodeIds, false)
              }
            }
          }
        }}
      >
        {renderBody({
          id,
          useStore,
          width: dimension.width,
          height: dimension.height - headbarHeight - footbarHeight,
        })}
      </div>

      {noFootbar || (
        <div ref={footbarRef} className='flow-view-node__footbar'>
          {outputs.map((props, i) => (
            <FlowViewOutput key={i} {...props} />
          ))}
        </div>
      )}
    </div>
  )
}

function FlowViewPin(props) {
  return (
    <div
      className='flow-view-pin'
      onClick={(event) => {
        event.stopPropagation()
      }}
      onMouseDown={(event) => {
        event.stopPropagation()
      }}
    />
  )
}

function FlowViewInput({ ...props }) {
  return <FlowViewPin {...props} />
}

function FlowViewOutput({ ...props }) {
  return <FlowViewPin {...props} />
}

function FlowPipePipe({ source, target, useStore }) {
  const [sourceNodeId] = source
  const [targetNodeId] = target

  const sourceNode = useStore(getNodeById(sourceNodeId))
  const targetNode = useStore(getNodeById(targetNodeId))

  const x1 = sourceNode.position.x
  const y1 = sourceNode.position.y

  const x2 = targetNode.position.x
  const y2 = targetNode.position.y

  return <line className='flow-view-pipe' x1={x1} y1={y1} x2={x2} y2={y2} />
}
