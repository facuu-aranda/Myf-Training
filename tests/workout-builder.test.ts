import { describe, expect, it } from 'vitest'
import { moveId, reorderIds, templateNames, templateWeekdays } from '../src/lib/workout-builder'

describe('workout builder ordering', () => {
  it('reorders an item before the target without mutating the input', () => {
    const ids = ['a', 'b', 'c']
    expect(reorderIds(ids, 'c', 'a')).toEqual(['c', 'a', 'b'])
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('moves items with bounds protection', () => {
    expect(moveId(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moveId(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c'])
    expect(moveId(['a', 'b', 'c'], 'missing', 1)).toEqual(['a', 'b', 'c'])
  })
})

describe('workout templates', () => {
  it('creates the requested weekly cadence and labels', () => {
    expect(templateWeekdays(3)).toEqual([1, 3, 5])
    expect(templateWeekdays(4)).toEqual([1, 3, 5, 6])
    expect(templateWeekdays(5)).toEqual([1, 2, 3, 4, 5])
    expect(templateNames(3)[0]).toEqual(['Upper body', 'Tren superior'])
    expect(templateNames(5)).toHaveLength(5)
  })
})
