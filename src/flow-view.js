import classnames from 'classnames'
import zustand from 'zustand'

const rootId = 0

const getNodeById = (nodeId) => (state) =>
  state.nodes.find(({ id }) => id === nodeId)
const getChildrenNodes = (id) => (state) =>
  state.nodes.filter(({ parentId }) => id === parentId)
const getHasChildrenNodes = (id) => (state) =>
  id === rootId || getNodeById(id)(state)?.hasChildren === true
const getNodeIsSelected = (id) => (state) =>
  getNodeById(id)(state)?.selected === true
const getNodeHasNoHeadbar = (id) => (state) =>
  getNodeById(id)(state)?.noHeadbar === true
const getNodeHasNoFootbar = (id) => (state) =>
  getNodeById(id)(state)?.noFootbar === true

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
  const { dimension, position } = useStore(getNodeById(id))
  const hasChildrenNodes = useStore(getHasChildrenNodes(id))
  const noFootbar = useStore(getNodeHasNoFootbar(id))
  const noHeadbar = useStore(getNodeHasNoHeadbar(id))
  const selected = useStore(getNodeIsSelected(id))
  const toggleSelection = useStore((state) =>
    state.setSelectedNodes([id], !selected)
  )
  const childrenNodes = useStore(getChildrenNodes(id))

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

      <div className='flow-view-node__body'>
        {hasChildrenNodes &&
          childrenNodes.map(({ id: childId, ...node }, i) => (
            <FlowViewNode key={i} id={childId} useStore={useStore} {...node} />
          ))}
      </div>

      {noFootbar || <div className='flow-view-node__footbar' />}
    </div>
  )
}
