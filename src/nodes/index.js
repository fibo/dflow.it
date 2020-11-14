import * as Addition from './Addition'
import * as IONumber from './IONumber'
import * as Markdown from './Markdown'

export const nodeType = [
  'Addition',
  'IONumber',
  'Markdown',
  'R3FCanvas',
].reduce((obj, key) => ({ ...obj, [key]: key }), {})

export const metadataMap = new Map()

metadataMap.set(nodeType.Addition, Addition.metadata)

export const taskMap = new Map()

taskMap.set(nodeType.Addition, Addition.task)
taskMap.set(nodeType.IONumber, IONumber.task)
taskMap.set(nodeType.Markdown, Markdown.task)

export const componentMap = new Map()

componentMap.set(nodeType.Addition, Addition.Component)
componentMap.set(nodeType.IONumber, IONumber.Component)
componentMap.set(nodeType.Markdown, Markdown.Component)
