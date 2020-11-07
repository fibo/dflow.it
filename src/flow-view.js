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
  zustand((set, get) => ({
    nextId: rootId + 1,
    nodes,
    setSelectedNodes: (selectedNodeIds, selected) => () =>
      set((state) => ({
        ...state,
        nodes: get().nodes.map(({ id, ...node }) =>
          selectedNodeIds.includes(id)
            ? { ...node, id, selected }
            : { ...node, id }
        ),
      })),
  }))

export function FlowViewNode({ id = rootId, parentId = rootId, useStore }) {
  const { dimension, position, noFootbar, noHeadbar, selected } = useStore(
    getNodeById(id)
  )
  const toggleSelection = useStore((state) =>
    state.setSelectedNodes([id], !selected)
  )
  const renderBody = useStore(getRenderBody(id))

  return (
    <div
      className={classnames('flow-view-node', {
        'flow-view-node--selected': selected,
      })}
      onClick={(event) => {
        event.stopPropagation()

        toggleSelection()
      }}
      style={{ ...dimension, top: position.y, left: position.x }}
    >
      {noHeadbar || <div className='flow-view-node__headbar' />}

      <div className='flow-view-node__body'>{renderBody(useStore)}</div>

      {noFootbar || <div className='flow-view-node__footbar' />}
    </div>
  )
}
