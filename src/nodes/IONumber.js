import { useEffect, useRef, useState } from 'react'

import { FlowViewNodeLabel } from '../flow-view'

export const metadata = {
  inputs: [
    {
      types: ['number'],
    },
  ],
  outputs: [
    {
      types: ['number'],
    },
  ],
}

/**
 * @example
 *
 * const value = parseFloat(data)
 *
 * if (isNumber(value) console.log(value, 'is a number')
 */
function isNumber(value) {
  return typeof value === 'number' && !isNaN(value)
}

function coerceToNumber(data) {
  const value = parseFloat(data)

  if (isNumber(value)) return value
}

export function task([data]) {
  if (isNumber(data)) {
    return data
  }
}

export function Component(props) {
  const { id, inputs, useStore } = props

  const inputRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [nextValue, setNextValue] = useState('')

  const updateGraph = useStore((state) => state.updateGraph)

  const inputData = inputs[0].data

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing, inputRef])

  return isEditing ? (
    <div className='dflow-node-io-number'>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          inputRef.current?.blur()
        }}
      >
        <input
          ref={inputRef}
          className='dflow-node-io-input'
          type='number'
          onBlur={() => {
            setIsEditing(false)

            updateGraph({
              nodes: [
                {
                  id,
                  inputs: [{ ...inputs[0], data: coerceToNumber(nextValue) }],
                },
              ],
            })
          }}
          onFocus={() => {
            if (isNumber(inputData)) {
              setNextValue(inputData)
            }
          }}
          onChange={(event) => {
            setNextValue(event.target.value)
          }}
          value={nextValue}
        />
      </form>
    </div>
  ) : (
    <FlowViewNodeLabel
      {...props}
      label={typeof inputData === 'number' ? String(inputData) : 'number'}
      onClick={() => {
        setIsEditing(true)
      }}
    />
  )
}
