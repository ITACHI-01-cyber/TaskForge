import { useTasks } from './useTasks'
export const useHabits = () => useTasks().items.filter(item => item.kind === 'habit')