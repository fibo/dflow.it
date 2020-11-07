import classnames from 'classnames'
import zustand from 'zustand'

const rootId = 0

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

const getDescendantNodes = (id) => (state) =>
  getChildrenNodes(id)(state).reduce(
    (descendants, node) =>
      descendants.concat(node).concat(getDescendantNodes(node.id)(state)),
    []
  )

const getDescendantNodeIds = (id) => (state) =>
  getDescendantNodes(id)(state).map(({ id }) => id)

const getIsContainer = (id) => (state) =>
  id === rootId || getNodeById(id)(state)?.isContainer === true

const getRenderBody = (id) => (state) => {
  const node = getNodeById(id)(state)

  const hasRenderBody = typeof node.renderBody === 'function'
  const isContainer = getIsContainer(id)(state)
  const childrenNodes = getChildrenNodes(id)(state)

  switch (true) {
    case hasRenderBody:
      return node.renderBody

    case isContainer:
      return (useStore) =>
        childrenNodes.map((node, i) => (
          <FlowViewNode key={i} useStore={useStore} {...node} />
        ))

    default:
      return () => null
  }
}

export const createFlowViewStore = (nodes) =>
  zustand((set) => ({
    nextId: rootId + 1,
    nodes,
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

  const { dimension, position, noFootbar, noHeadbar, selected } = useStore(
    getNodeById(id)
  )
  const descendantNodeIds = useStore(getDescendantNodeIds(id))
  const isContainer = useStore(getIsContainer(id))
  const renderBody = useStore(getRenderBody(id))
  const selectedNodes = useStore((state) =>
    state.nodes.filter(({ selected }) => selected)
  )
  const selectedNodesIds = selectedNodes.map(({ id }) => id)
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
      {noHeadbar || <div className='flow-view-node__headbar' />}

      <div className='flow-view-node__body'>{renderBody(useStore)}</div>

      {noFootbar || <div className='flow-view-node__footbar' />}
    </div>
  )
}
