function getInputPipes(node, pipes) {
  const { id: nodeId } = node

  return pipes.filter(({ target: [targetNodeId] }) => targetNodeId === nodeId)
}

function getParentsOfNode(node, nodes, pipes) {
  const parentNodesIds = getInputPipes(node, pipes).map(
    ({ source: [sourceNodeId] }) => sourceNodeId
  )

  return nodes.filter(({ id }) => parentNodesIds.includes(id))
}

// The level of a node is the max level of its parents + 1.
function getNodeLevel(node, nodes, pipes) {
  const parentsOfNode = getParentsOfNode(node, nodes, pipes)

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

      if (levelA < levelB) return 1
      if (levelA > levelB) return -1
      return 0
    })
    .reduce(
      ({ errorMap, outputMap }, node) => {
        const { id, inputs, type } = node

        const task = taskMap.get(type)

        if (typeof task === 'function') {
          try {
            const output = task(inputs)

            outputMap.set(id, output)
          } catch (error) {
            errorMap.set(id, error.message)
          }
        } else {
          console.warn('task not found, node id and type are:', id, type)
        }

        return { errorMap, outputMap }
      },
      { errorMap: new Map(), outputMap: new Map() }
    )
}
