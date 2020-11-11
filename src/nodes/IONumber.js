export const metadata = {
  inputs: [
    {
      num: 1,
      types: ['number'],
    },
  ],
  outputs: [
    {
      num: 1,
      types: ['number'],
    },
  ],
}

export function task([data]) {
  if (typeof data === 'number' && !isNaN(data)) {
    return data
  }
}
