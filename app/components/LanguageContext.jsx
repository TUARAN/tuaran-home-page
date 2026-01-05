'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('zh')

  // 从 localStorage 读取保存的语言设置
  useEffect(() => {
    const saved = localStorage.getItem('language')
    if (saved) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (newLang) => {
    setLanguageState(newLang)
    localStorage.setItem('language', newLang)
  }

  // 切换语言时保存到 localStorage
  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh'
    setLanguage(newLang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
