export const metadata = {
  inputs: [
    {
      num: 2,
      types: ['number', 'string'],
    },
  ],
  outputs: [
    {
      num: 1,
      types: ['number'],
    },
  ],
}

export function task([a, b]) {
  return a + b
}
