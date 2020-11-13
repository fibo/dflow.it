import * as Addition from './Addition'
import * as IONumber from './IONumber'
import * as Markdown from './Markdown'

export const taskMap = new Map()

taskMap.set('Addition', Addition.task)
taskMap.set('IONumber', IONumber.task)
taskMap.set('Markdown', Markdown.task)
