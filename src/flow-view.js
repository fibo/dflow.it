import classnames from 'classnames'
import { useEffect, useState, useRef } from 'react'
import zustand from 'zustand'

const emptyArea = { width: 0, height: 0 }
const originVector = { x: 0, y: 0 }
const rootId = 0
const halfPinSize = 5
const pinSize = 2 * halfPinSize
const nodeBorderWidth = 1

const PinClass = {
  input: 'input',
  output: 'output',
}

const toId = ({ id }) => id
const notFlowViewRoot = ({ id }) => id !== rootId
const isSelected = ({ selected }) => selected

const getNodeById = (nodeId) => (state) =>
  state.nodes.find(({ id }) => id === nodeId)

const getChildrenNodes = (id) => (state) =>
  id === rootId
    ? state.nodes.filter(
        ({ id: childId, containerId }) =>
          childId !== rootId &&
          (containerId === rootId || typeof containerId === 'undefined')
      )
    : state.nodes.filter(({ containerId }) => id === containerId)

const getChildrenPipes = (id) => (state) =>
  state.pipes.filter(({ containerId }) =>
    id === rootId
      ? containerId === rootId || typeof containerId === 'undefined'
      : id === containerId
  )

const getDescendantNodes = (id) => (state) =>
  getChildrenNodes(id)(state).reduce(
    (descendants, node) =>
      descendants.concat(node).concat(getDescendantNodes(node.id)(state)),
    []
  )

const getInputPipe = (nodeId, inputIndex) => (state) =>
  state.pipes.find(
    ({ target: [targetNodeId, targetPinIndex] }) =>
      nodeId === targetNodeId && inputIndex === targetPinIndex
  )

const getSourcePin = (nodeId, inputIndex) => (state) => {
  const inputPipe = getInputPipe(nodeId, inputIndex)(state)

  if (inputPipe) {
    const {
      source: [sourceNodeId, sourcePinIndex],
    } = inputPipe

    const sourceNode = getNodeById(sourceNodeId)(state)

    return sourceNode.outputs[sourcePinIndex]
  }
}

const getDescendantNodeIds = (id) => (state) =>
  getDescendantNodes(id)(state).map(toId)

const getSelectedNodes = (state) => state.nodes.filter(isSelected)

const getSelectedNodeIds = (state) => getSelectedNodes(state).map(toId)

const getSomeDescendantNodeIsSelected = (id) => (state) =>
  getDescendantNodes(id)(state).some(isSelected)

const getIsContainer = (id) => (state) =>
  id === rootId || getNodeById(id)(state)?.isContainer === true

function FlowViewContainer({ id, useStore, width, height }) {
  const childrenNodes = useStore(getChildrenNodes(id))
  const childrenPipes = useStore(getChildrenPipes(id))

  return (
    <>
      {childrenNodes.map((props, i) => (
        <FlowViewNode key={i} useStore={useStore} {...props} />
      ))}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {childrenPipes.map((props, i) => (
          <FlowViewPipe key={i} useStore={useStore} {...props} />
        ))}
      </svg>
    </>
  )
}

export function FlowViewNodeLabel({ label, comment, onClick }) {
  return (
    <div
      className={classnames('flow-view-node__label', {
        'flow-view-node__label--has-comment': comment,
      })}
      onClick={onClick}
    >
      <span>{label}</span>
      {comment && <span className='flow-view-node__comment'>{comment}</span>}
    </div>
  )
}

const getRenderBody = (id) => (state) => {
  const node = getNodeById(id)(state)

  const { Component } = node
  const hasComponent = typeof Component === 'function'
  const isContainer = getIsContainer(id)(state)

  switch (true) {
    case hasComponent:
      return (props) => <Component {...props} />

    case isContainer:
      return (props) => <FlowViewContainer {...props} />

    default:
      return () => null
  }
}

export function flowViewGraphIsValid() {
  // TODO
  return true
}

export function flowViewGraphTopologyFingerprint({ nodes, pipes }) {
  const nodesSignature = nodes
    .filter(notFlowViewRoot)
    .map(({ containerId, id, type = '' }) => [containerId, id, type].join())
    .sort()

  const pipesSignature = pipes
    .map(({ containerId, id, source, target }) =>
      [containerId, id].concat(source, target).join()
    )
    .sort()

  return `nodes=${nodesSignature.join()}&pipes=${pipesSignature.join()}`
}

export const createFlowViewStore = () =>
  zustand((set, get) => ({
    nextId: rootId + 1,
    focusedPinTypes: [],
    nodes: [
      {
        id: rootId,
        containerId: rootId,
        isContainer: true,
        dimension: emptyArea,
        position: originVector,
        noFootbar: true,
        noHeadbar: true,
      },
    ],
    pipes: [],
    updateGraph: ({ nodes = [], pipes = [] }) => {
      set((state) => ({
        nodes: state.nodes.map(({ id, ...node }) => {
          const updatedNode = nodes.find(({ id: nodeId }) => id === nodeId)

          if (updatedNode) {
            return {
              id,
              ...node,
              ...updatedNode,
            }
          } else {
            return { id, ...node }
          }
        }),
        pipes: state.pipes.map(({ containerId, id, ...pipe }) => {
          const updatedPipe = pipes.find(
            ({ containerId: pipeContainerId, id: pipeId }) =>
              id === pipeId && pipeContainerId === pipeId
          )

          if (updatedPipe) {
            return {
              id,
              containerId,
              ...pipe,
              ...updatedPipe,
            }
          } else {
            return {
              containerId,
              id,
              ...pipe,
            }
          }
        }),
      }))
    },
    appendGraph: ({ nodes = [], pipes = [] }) => {
      const graphIsValid = flowViewGraphIsValid({ nodes, pipes })

      if (graphIsValid === false) {
        console.error('flow view graph is not valid')
        return
      }

      let nextId = get().nextId

      const idLookup = new Map()
      idLookup.set(rootId, rootId)

      nodes.concat(pipes).forEach(({ containerId, id }) => {
        if (!idLookup.has(containerId)) {
          idLookup.set(containerId, nextId++)
        }

        if (!idLookup.has(id)) {
          idLookup.set(id, nextId++)
        }
      })

      set((state) => ({
        nextId,
        nodes: state.nodes.concat(
          nodes.map(({ containerId, id, ...rest }) => ({
            containerId: idLookup.get(containerId),
            id: idLookup.get(id),
            ...rest,
          }))
        ),
        pipes: state.pipes.concat(
          pipes.map(
            ({
              containerId,
              id,
              source: [sourceNodeId, sourcePinIndex],
              target: [targetNodeId, targetPinIndex],
              ...rest
            }) => ({
              containerId: idLookup.get(containerId),
              id: idLookup.get(id),
              source: [idLookup.get(sourceNodeId), sourcePinIndex],
              target: [idLookup.get(targetNodeId), targetPinIndex],
              ...rest,
            })
          )
        ),
      }))
    },
    setFocusedPinClass: (focusedPinClass) => {
      set((state) => ({ focusedPinClass }))
    },
    setFocusedPinData: (focusedPinData) => {
      set((state) => ({ focusedPinData }))
    },
    setFocusedPinNodeId: (focusedPinNodeId) => {
      set((state) => ({ focusedPinNodeId }))
    },
    setFocusedPinContainerId: (focusedPinContainerId) => {
      set((state) => ({ focusedPinContainerId }))
    },
    setFocusedPinTypes: (focusedPinTypes = []) =>
      set((state) => ({ focusedPinTypes })),
    setRootDimension: (dimension) => {
      set((state) => ({
        nodes: state.nodes.map(({ id, ...node }) =>
          id === rootId ? { ...node, id, dimension } : { id, ...node }
        ),
      }))
    },
    setRootPosition: (position) => {
      set((state) => ({
        nodes: state.nodes.map(({ id, ...node }) =>
          id === rootId ? { ...node, id, position } : { id, ...node }
        ),
      }))
    },
    setSelectedNodes: (nodeIds, selected) => {
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
      }))
    },
    setStartDraggingPoint: (startDraggingPoint) => {
      set((state) => ({ startDraggingPoint }))
    },
    translateNodes: (nodeIds, draggingDelta) => {
      set((state) => ({
        nodes: state.nodes.map(({ id, position, ...node }) =>
          nodeIds.includes(id)
            ? {
                ...node,
                id,
                position: {
                  x: Math.max(0, position.x + draggingDelta.x),
                  y: Math.max(0, position.y + draggingDelta.y),
                },
              }
            : { ...node, id, position }
        ),
      }))
    },
  }))

export function FlowViewNode({
  id = rootId,
  containerId = rootId,
  label,
  comment,
  useStore,
  error,
}) {
  const isRoot = (id === rootId) === containerId

  const [footbarHeight, setFootbarHeight] = useState(0)
  const [headbarHeight, setHeadbarHeight] = useState(0)

  const footbarRef = useRef()
  const headbarRef = useRef()

  const {
    dimension = emptyArea,
    position,
    inputs = [],
    noFootbar,
    noHeadbar,
    outputs = [],
    selected,
  } = useStore(getNodeById(id))

  const { width, height } = dimension

  const descendantNodeIds = useStore(getDescendantNodeIds(id))
  const focusedPinNodeId = useStore((state) => state.focusedPinNodeId)
  const focusedPinData = useStore((state) => state.focusedPinData)
  const focusedPinTypes = useStore((state) => state.focusedPinTypes)
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

  useEffect(() => {
    if (headbarRef.current) {
      const { height } = headbarRef.current.getBoundingClientRect()

      setHeadbarHeight(id, height)
    }
  }, [id, headbarRef, setHeadbarHeight])

  useEffect(() => {
    if (footbarRef.current) {
      const { height } = footbarRef.current.getBoundingClientRect()

      setFootbarHeight(id, height)
    }
  }, [id, footbarRef, setFootbarHeight])

  return (
    <>
      <div
        className={classnames('flow-view-node', {
          'flow-view-node--has-error': typeof error === 'string',
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
        style={{ ...dimension, top: position?.y, left: position?.x }}
      >
        {noHeadbar || (
          <div ref={headbarRef} className='flow-view-node__headbar'>
            {inputs.map((props, i) => (
              <FlowViewInput
                key={i}
                containerId={containerId}
                nodeId={id}
                index={i}
                useStore={useStore}
                {...props}
              />
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
          onMouseLeave={() => {
            if (isContainer) {
              setStartDraggingPoint()
            }
          }}
        >
          {renderBody({
            id,
            containerId,
            inputs,
            outputs,
            label,
            comment,
            selected,
            error,
            useStore,
            width,
            height: height - headbarHeight - footbarHeight,
          })}
        </div>

        {noFootbar || (
          <div ref={footbarRef} className='flow-view-node__footbar'>
            {outputs.map((props, i) => (
              <FlowViewOutput
                key={i}
                containerId={containerId}
                nodeId={id}
                index={i}
                useStore={useStore}
                {...props}
              />
            ))}
          </div>
        )}
      </div>
      {focusedPinNodeId === id && (
        <div
          className='flow-view-node__pin-preview'
          style={{
            left: position.x + dimension.width + 10,
            top: position.y,
          }}
        >
          <div className='flow-view-node__pin-preview-types'>
            {Array.isArray(focusedPinTypes) ? focusedPinTypes.join() : 'any'}
          </div>

          <div className='flow-view-node__pin-preview-data'>
            {typeof focusedPinData === 'undefined'
              ? 'undefined'
              : String(focusedPinData)}
          </div>
        </div>
      )}
    </>
  )
}

function FlowViewPin({
  containerId,
  data,
  index,
  nodeId,
  pinClass,
  types,
  useStore,
}) {
  const setFocusedPinClass = useStore((state) => state.setFocusedPinClass)
  const setFocusedPinData = useStore((state) => state.setFocusedPinData)
  const setFocusedPinContainerId = useStore(
    (state) => state.setFocusedPinContainerId
  )
  const setFocusedPinNodeId = useStore((state) => state.setFocusedPinNodeId)
  const setFocusedPinTypes = useStore((state) => state.setFocusedPinTypes)
  const focusedPinClass = useStore((state) => state.focusedPinClass)
  const focusedPinContainerId = useStore((state) => state.focusedPinContainerId)
  const focusedPinNodeId = useStore((state) => state.focusedPinNodeId)
  const focusedPinTypes = useStore((state) => state.focusedPinTypes)

  const focusedPinIsInSameContainer =
    typeof focusedPinContainerId !== 'undefined' &&
    containerId === focusedPinContainerId
  const focusedPinIsNotInSameNode =
    typeof focusedPinNodeId !== 'undefined' && nodeId !== focusedPinNodeId
  const hasSomeHighlightedType = types.some((type) =>
    focusedPinTypes.includes(type)
  )
  const oppositePinClassIsFocused =
    typeof focusedPinClass === 'string' && focusedPinClass !== pinClass

  const highlighted =
    hasSomeHighlightedType &&
    oppositePinClassIsFocused &&
    focusedPinIsInSameContainer &&
    focusedPinIsNotInSameNode

  return (
    <div
      className={classnames('flow-view-pin', {
        'flow-view-pin--highlighted': highlighted,
      })}
      onClick={(event) => {
        event.stopPropagation()
      }}
      onMouseDown={(event) => {
        event.stopPropagation()
      }}
      onMouseEnter={() => {
        setFocusedPinClass(pinClass)
        setFocusedPinData(data)
        setFocusedPinContainerId(containerId)
        setFocusedPinNodeId(nodeId)
        setFocusedPinTypes(types)
      }}
      onMouseLeave={() => {
        setFocusedPinClass()
        setFocusedPinData()
        setFocusedPinNodeId()
        setFocusedPinTypes()
      }}
    />
  )
}

function FlowViewInput(props) {
  const { nodeId, index, useStore } = props

  const sourcePin = useStore(getSourcePin(nodeId, index))

  return (
    <FlowViewPin
      pinClass={PinClass.input}
      {...props}
      data={sourcePin ? sourcePin.data : props.data}
    />
  )
}

function FlowViewOutput(props) {
  return <FlowViewPin pinClass={PinClass.output} {...props} />
}

const getCenterOfPin = ({
  pinSize,
  nodeHeight,
  nodeWidth,
  numPins,
  pinClass,
  pinIndex,
}) => {
  const pinX =
    pinIndex === 0 ? 0 : (pinIndex * (nodeWidth - pinSize)) / (numPins - 1)
  const pinY = pinClass === PinClass.input ? 0 : nodeHeight - pinSize

  return {
    x: pinX,
    y: pinY,
  }
}

function FlowViewPipe({ source, target, useStore }) {
  const [sourceNodeId, sourcePinIndex] = source
  const [targetNodeId, targetPinIndex] = target

  const {
    dimension: sourceDimension,
    position: sourcePosition,
    outputs: sourceOutputs = [],
  } = useStore(getNodeById(sourceNodeId))

  const {
    dimension: targetDimension,
    position: targetPosition,
    inputs: targetInputs = [],
  } = useStore(getNodeById(targetNodeId))

  const sourceCenter = getCenterOfPin({
    pinSize,
    nodeHeight: sourceDimension.height,
    nodeWidth: sourceDimension.width,
    numPins: sourceOutputs.length,
    pinClass: PinClass.output,
    pinIndex: sourcePinIndex,
  })

  const targetCenter = getCenterOfPin({
    pinSize,
    nodeHeight: targetDimension.height,
    nodeWidth: targetDimension.width,
    numPins: targetInputs.length,
    pinClass: PinClass.input,
    pinIndex: targetPinIndex,
  })

  if (
    typeof sourceCenter === 'undefined' ||
    typeof targetCenter === 'undefined'
  )
    return null

  const x1 = sourcePosition.x + sourceCenter.x + nodeBorderWidth + halfPinSize
  const y1 = sourcePosition.y + sourceCenter.y + nodeBorderWidth + halfPinSize

  const x2 = targetPosition.x + targetCenter.x + nodeBorderWidth + halfPinSize
  const y2 = targetPosition.y + targetCenter.y + nodeBorderWidth + halfPinSize

  return <line className='flow-view-pipe' x1={x1} y1={y1} x2={x2} y2={y2} />
}
