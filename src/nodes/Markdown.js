import Markdown from 'react-markdown'
import gfm from 'remark-gfm'

export const metadata = {
  inputs: [
    {
      name: 'rows',
      types: ['string[]'],
    },
  ],
}

export function task() {}

export function Component({ inputs: [rows] }) {
  return (
    <div>
      <Markdown plugins={[gfm]}>
        {Array.isArray(rows.data) && rows.data.join('\n')}
      </Markdown>
    </div>
  )
}
