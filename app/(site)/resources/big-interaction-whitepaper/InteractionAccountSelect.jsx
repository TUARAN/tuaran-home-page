'use client'

import { useId } from 'react'

import { X_INTERACTION_AGENT_POOL } from '../../../../lib/interaction/agentPool.js'
import {
  canonicalDailyTopSubject,
  dailyTopSubjectKey,
  isDailyTopSubject,
} from '../../../../lib/interaction/dailyTop/model.js'
import styles from './interactionAccountSelect.module.css'

export default function InteractionAccountSelect({
  account,
  onChoose,
  ariaLabel = '选择智能体账号',
  label = '选择账号',
}) {
  const selectId = useId()
  const value = canonicalDailyTopSubject(account)

  function onChange(event) {
    const next = canonicalDailyTopSubject(event.target.value)
    if (!isDailyTopSubject(next) || dailyTopSubjectKey(next) === dailyTopSubjectKey(value)) return
    onChoose(next)
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={styles.select}
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
      >
        {X_INTERACTION_AGENT_POOL.map((agent) => (
          <option key={agent.handle} value={agent.handle}>
            {agent.name} · @{agent.handle}
          </option>
        ))}
      </select>
    </div>
  )
}