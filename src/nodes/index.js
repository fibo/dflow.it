import * as Addition from './Addition'
import * as Box3D from './Box3D'
import * as Canvas3D from './Canvas3D'
import * as IONumber from './IONumber'
import * as Markdown from './Markdown'

export const nodeType = [
  'Addition',
  'Box3D',
  'Canvas3D',
  'IONumber',
  'Markdown',
  'Vector3D',
].reduce((obj, key) => ({ ...obj, [key]: key }), {})

export const taskMap = new Map()

taskMap.set(nodeType.Addition, Addition.task)
taskMap.set(nodeType.Box3D, Box3D.task)
taskMap.set(nodeType.Canvas3D, Canvas3D.task)
taskMap.set(nodeType.IONumber, IONumber.task)
taskMap.set(nodeType.Markdown, Markdown.task)

export const componentMap = new Map()

componentMap.set(nodeType.Addition, Addition.Component)
componentMap.set(nodeType.Box3D, Box3D.Component)
componentMap.set(nodeType.Canvas3D, Canvas3D.Component)
componentMap.set(nodeType.IONumber, IONumber.Component)
componentMap.set(nodeType.Markdown, Markdown.Component)
