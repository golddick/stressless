import { describe, expect, it } from 'vitest'
import { parseCsv } from '../../src/server/utils/csv'

describe('csv import parser', () => {
  it('parses headers, quotes and CRLF', () => {
    const rows = parseCsv('barcode,name,price\r\n123,"Milk, 1L",2200\r\n456,"The ""big"" one",50\r\n')
    expect(rows).toEqual([{ barcode: '123', name: 'Milk, 1L', price: '2200' }, { barcode: '456', name: 'The "big" one', price: '50' }])
  })
  it('skips blank lines', () => {
    expect(parseCsv('a,b\n1,2\n\n3,4\n')).toHaveLength(2)
  })
})
