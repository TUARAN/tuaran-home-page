'use client'

import { useCallback, useEffect, useState } from 'react'

import ModelSelector from '../../components/ModelSelector'

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

export default function AutomationModelSelector() {
  const [options, setOptions] = useState([])
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/morning-greeting/model-selection', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setOptions(payload.options || [])
      setValue(payload.selectedModelId || '')
    } catch (fetchError) {
      setError(fetchError?.message || '模型列表读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function selectModel(modelId) {
    const previous = value
    setValue(modelId)
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/morning-greeting/model-selection', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setValue(payload.selectedModelId)
    } catch (saveError) {
      setValue(previous)
      setError(saveError?.message || '模型切换失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-4 rounded-xl border border-[#d9ddd2] bg-[#f7f9f4] p-4 dark:border-[#263142] dark:bg-[#10161f]" aria-labelledby="automation-model-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="automation-model-title" className="m-0 text-[14px] font-semibold text-[#25261f] dark:text-gray-100">X 自动发布模型</h2>
          <p className="mb-0 mt-1 text-[12px] text-[#77796e] dark:text-gray-400">只作用于本页的自动发布任务；其他页面各自保存模型选择。</p>
        </div>
        <div className="w-full md:w-[420px]">
          <ModelSelector
            variant="compact"
            label={saving ? '正在切换' : '选择模型'}
            options={options}
            value={value}
            onChange={selectModel}
            disabled={loading || saving}
          />
        </div>
      </div>
      {error ? <p role="alert" className="mb-0 mt-2 text-[12px] text-rose-700 dark:text-rose-300">{error}</p> : null}
    </section>
  )
}
