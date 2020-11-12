function getInputPipe(nodeId, inputIndex, pipes) {
  return pipes.find(
    ({ target: [targetNodeId, targetPinIndex] }) =>
      targetNodeId === nodeId && targetPinIndex === inputIndex
  )
}

function getInputPipes(nodeId, pipes) {
  return pipes.filter(({ target: [targetNodeId] }) => targetNodeId === nodeId)
}

function getParentsOfNode(nodeId, nodes, pipes) {
  const parentNodesIds = getInputPipes(nodeId, pipes).map(
    ({ source: [sourceNodeId] }) => sourceNodeId
  )

  return nodes.filter(({ id }) => parentNodesIds.includes(id))
}

// The level of a node is the max level of its parents + 1.
function getNodeLevel(node, nodes, pipes) {
  const { id: nodeId } = node

  const parentsOfNode = getParentsOfNode(nodeId, nodes, pipes)

  if (parentsOfNode.length === 0) {
    return 0
  } else {
    return (
      1 +
      parentsOfNode.reduce(
        (level, parentNode) =>
          Math.max(level, getNodeLevel(parentNode, nodes, pipes)),
        0
      )
    )
  }
}

export function dflowFun({ nodes: previousNodes, pipes }, taskMap) {
  return previousNodes
    .sort((nodeA, nodeB) => {
      const levelA = getNodeLevel(nodeA, previousNodes, pipes)
      const levelB = getNodeLevel(nodeB, previousNodes, pipes)

      if (levelA > levelB) return 1
      if (levelA < levelB) return -1
      return 0
    })
    .reduce(
      ({ errorMap, outputMap }, node) => {
        const { id: nodeId, inputs, type } = node

        const task = taskMap.get(type)

        if (typeof task === 'function') {
          try {
            const args = inputs.map(({ data }, inputIndex) => {
              const inputPipe = getInputPipe(nodeId, inputIndex, pipes)

              if (inputPipe) {
                const {
                  source: [sourceNodeId],
                } = inputPipe

                return outputMap.get(sourceNodeId)
              } else {
                return data
              }
            })

            const output = task(args)

            outputMap.set(nodeId, output)
          } catch (error) {
            errorMap.set(nodeId, error.message)
          }
        } else {
          console.warn('task not found', 'nodeId =', nodeId, 'type = ', type)
        }

        return { errorMap, outputMap }
      },
      { errorMap: new Map(), outputMap: new Map() }
    )
}
