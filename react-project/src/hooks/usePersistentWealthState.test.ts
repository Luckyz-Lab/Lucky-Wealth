import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../lib/defaults'
import { STORAGE_VERSION } from '../types'
import { normalizeState, validateImportedState } from './usePersistentWealthState'

describe('state normalization', () => {
  it('migrates old state payloads to the current storage version', () => {
    const migrated = normalizeState({
      ownerName: 'Tester',
      incomes: [{ id: 'i1', t: 'Salary', a: 1000, tp: '40_1' }],
      expenses: [],
      assets: [],
      debts: [],
      ded: DEFAULT_STATE.ded,
      ret: DEFAULT_STATE.ret,
      docs: [],
      chat: [],
    })

    expect(migrated.storageVersion).toBe(STORAGE_VERSION)
    expect(migrated.ownerName).toBe('Tester')
    expect(migrated.incomes).toHaveLength(1)
  })

  it('rejects imports without the minimum app shape', () => {
    expect(validateImportedState({ foo: 'bar' })).toBeNull()
  })

  it('accepts valid exported state payloads', () => {
    const imported = validateImportedState(DEFAULT_STATE)

    expect(imported).not.toBeNull()
    expect(imported?.storageVersion).toBe(STORAGE_VERSION)
  })
})
