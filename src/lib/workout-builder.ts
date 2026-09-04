export type WorkoutTemplateDays = 3 | 4 | 5

export function reorderIds(ids: string[], draggedId: string, targetId: string): string[] {
  const next = ids.slice()
  const from = next.indexOf(draggedId)
  const to = next.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) return next
  next.splice(from, 1)
  next.splice(to, 0, draggedId)
  return next
}

export function moveId(ids: string[], id: string, offset: number): string[] {
  const from = ids.indexOf(id)
  const to = from + offset
  if (from < 0 || to < 0 || to >= ids.length) return ids.slice()
  return reorderIds(ids, id, ids[to])
}

export function templateWeekdays(dayCount: WorkoutTemplateDays) {
  return dayCount === 3 ? [1, 3, 5] : dayCount === 4 ? [1, 3, 5, 6] : [1, 2, 3, 4, 5]
}

export function templateNames(dayCount: WorkoutTemplateDays) {
  return dayCount === 3
    ? [['Upper body', 'Tren superior'], ['Lower body', 'Tren inferior'], ['Full body', 'Cuerpo completo']]
    : dayCount === 4
      ? [['Upper body', 'Tren superior'], ['Lower body', 'Tren inferior'], ['Upper body 2', 'Tren superior 2'], ['Lower body 2', 'Tren inferior 2']]
      : [['Push', 'Empuje'], ['Pull', 'Tirón'], ['Legs', 'Piernas'], ['Upper body', 'Tren superior'], ['Lower body', 'Tren inferior']]
}
