'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconClock,
  IconFlag,
  IconRefresh,
  IconTargetArrow,
  IconX,
} from '@tabler/icons-react'

import { QUESTION_BANK_2026, QUESTION_BANK_META } from '../../../lib/questionBank2026'
import styles from './quiz.module.css'

const LETTERS = ['A', 'B', 'C', 'D']
const EXAM_CONFIG = {
  20: 30 * 60,
  50: 60 * 60,
  100: 120 * 60,
}

function shuffle(items) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

function formatTime(value) {
  const safe = Math.max(0, value)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function QuizClient() {
  const [mode, setMode] = useState('home')
  const [examSize, setExamSize] = useState(20)
  const [questions, setQuestions] = useState(QUESTION_BANK_2026)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(EXAM_CONFIG[20])

  const currentQuestion = questions[current]
  const answeredCount = Object.keys(answers).length
  const correctCount = useMemo(
    () => questions.reduce((total, question) => total + (answers[question.id] === question.answer ? 1 : 0), 0),
    [answers, questions],
  )
  const wrongQuestions = useMemo(
    () => questions.filter((question) => answers[question.id] !== question.answer),
    [answers, questions],
  )
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  const finishExam = useCallback(() => setSubmitted(true), [])

  useEffect(() => {
    if (mode !== 'exam' || submitted) return undefined
    if (timeLeft <= 0) {
      finishExam()
      return undefined
    }
    const timer = window.setInterval(() => setTimeLeft((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [finishExam, mode, submitted, timeLeft])

  useEffect(() => {
    if (mode === 'home' || submitted) return undefined
    function onKeyDown(event) {
      const option = Number(event.key) - 1
      if (option >= 0 && option <= 3 && currentQuestion) {
        setAnswers((previous) => ({ ...previous, [currentQuestion.id]: option }))
      }
      if (event.key === 'ArrowLeft') setCurrent((value) => Math.max(0, value - 1))
      if (event.key === 'ArrowRight') setCurrent((value) => Math.min(questions.length - 1, value + 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentQuestion, mode, questions.length, submitted])

  function startLearning() {
    setMode('learn')
    setQuestions(QUESTION_BANK_2026)
    setAnswers({})
    setCurrent(0)
    setSubmitted(false)
  }

  function startExam() {
    setMode('exam')
    setQuestions(shuffle(QUESTION_BANK_2026).slice(0, examSize))
    setAnswers({})
    setCurrent(0)
    setSubmitted(false)
    setTimeLeft(EXAM_CONFIG[examSize])
  }

  function returnHome() {
    setMode('home')
    setAnswers({})
    setCurrent(0)
    setSubmitted(false)
  }

  function choose(optionIndex) {
    if (!currentQuestion || submitted) return
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionIndex }))
  }

  function nextQuestion() {
    setCurrent((value) => Math.min(questions.length - 1, value + 1))
  }

  if (mode === 'home') {
    return (
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.eyebrow}>QUESTION BANK · 2026</div>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>党建知识自测</p>
              <h1>把 100 道题，<br />真正学会。</h1>
            </div>
            <div className={styles.heroCopy}>
              <p>完整收录《{QUESTION_BANK_META.source.replace('.doc', '')}》内容。先在学习模式逐题巩固，再用考试模式检验掌握程度。</p>
              <div className={styles.metrics} aria-label="题库信息">
                <span><strong>100</strong> 道单选题</span>
                <span><strong>3</strong> 个知识板块</span>
                <span><strong>2</strong> 种答题模式</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.modeGrid} aria-label="选择答题模式">
          <button type="button" className={styles.modeCard} onClick={startLearning}>
            <div className={styles.modeIndex}>01</div>
            <div className={styles.modeIcon}><IconBook2 size={25} stroke={1.7} /></div>
            <h2>学习模式</h2>
            <p>按原题顺序学习，作答后立即显示对错和正确答案，适合查漏补缺。</p>
            <span className={styles.modeAction}>开始学习 <IconArrowRight size={18} /></span>
          </button>

          <div className={`${styles.modeCard} ${styles.examCard}`}>
            <div className={styles.modeIndex}>02</div>
            <div className={styles.modeIcon}><IconTargetArrow size={25} stroke={1.7} /></div>
            <h2>考试模式</h2>
            <p>随机抽题、限时作答，交卷后统一显示成绩和错题。</p>
            <div className={styles.examPicker} role="group" aria-label="考试题数">
              {[20, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={examSize === size ? styles.examSizeActive : ''}
                  onClick={() => setExamSize(size)}
                >
                  {size} 题
                </button>
              ))}
            </div>
            <button type="button" className={styles.examStart} onClick={startExam}>
              开始考试 · {EXAM_CONFIG[examSize] / 60} 分钟 <IconArrowRight size={18} />
            </button>
          </div>
        </section>

        <section className={styles.syllabus}>
          <div>
            <span>01—63</span>
            <h3>理论与党史</h3>
            <p>党的理论、发展历程、组织建设与基本知识。</p>
          </div>
          <div>
            <span>64—73</span>
            <h3>企业发展</h3>
            <p>中国移动及互联网公司发展定位与党建工作。</p>
          </div>
          <div>
            <span>74—100</span>
            <h3>纪律与作风</h3>
            <p>党纪学习、监督执纪、八项规定与政绩观。</p>
          </div>
        </section>
      </main>
    )
  }

  if (submitted) {
    const score = Math.round((correctCount / questions.length) * 100)
    return (
      <main className={styles.page}>
        <section className={styles.resultHero}>
          <button type="button" className={styles.textButton} onClick={returnHome}><IconArrowLeft size={17} /> 返回首页</button>
          <p className={styles.kicker}>考试结果</p>
          <div className={styles.scoreLine}>
            <strong>{score}</strong>
            <span>分</span>
          </div>
          <p className={styles.resultLead}>
            答对 {correctCount} 题，答错或未答 {wrongQuestions.length} 题。
            {score >= 90 ? '掌握得很扎实，继续保持。' : score >= 75 ? '基础不错，集中复习错题会更稳。' : '建议回到学习模式逐题巩固。'}
          </p>
          <div className={styles.resultActions}>
            <button type="button" className={styles.primaryButton} onClick={startExam}><IconRefresh size={17} /> 再考一次</button>
            <button type="button" className={styles.secondaryButton} onClick={startLearning}><IconBook2 size={17} /> 进入学习模式</button>
          </div>
        </section>

        <section className={styles.reviewSection}>
          <div className={styles.sectionHeading}>
            <div><span>REVIEW</span><h2>{wrongQuestions.length ? '错题复盘' : '全部答对'}</h2></div>
            <p>{wrongQuestions.length ? '答案以原题库标注为准。' : '本轮没有错题，可以尝试更多题量。'}</p>
          </div>
          <div className={styles.reviewList}>
            {wrongQuestions.map((question) => (
              <article key={question.id} className={styles.reviewItem}>
                <div className={styles.reviewNumber}>原题 {String(question.id).padStart(3, '0')}</div>
                <h3>{question.question}</h3>
                <p className={styles.wrongAnswer}>
                  你的答案：{answers[question.id] === undefined ? '未作答' : `${LETTERS[answers[question.id]]}. ${question.options[answers[question.id]]}`}
                </p>
                <p className={styles.rightAnswer}><IconCheck size={17} /> 正确答案：{LETTERS[question.answer]}. {question.options[question.answer]}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    )
  }

  const selected = answers[currentQuestion.id]
  const isLearning = mode === 'learn'
  const showFeedback = isLearning && selected !== undefined

  return (
    <main className={`${styles.page} ${styles.quizPage}`}>
      <header className={styles.quizHeader}>
        <button type="button" className={styles.textButton} onClick={returnHome}><IconArrowLeft size={17} /> 退出</button>
        <div className={styles.headerTitle}>
          <span>{isLearning ? 'LEARNING MODE' : 'EXAM MODE'}</span>
          <strong>{isLearning ? '学习模式' : `${questions.length} 题考试`}</strong>
        </div>
        <div className={styles.headerStatus}>
          {isLearning ? <><IconBook2 size={17} /> 已完成 {answeredCount}/{questions.length}</> : <><IconClock size={17} /> {formatTime(timeLeft)}</>}
        </div>
      </header>

      <div className={styles.progressTrack} aria-label={`完成进度 ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.quizLayout}>
        <section className={styles.questionPanel}>
          <div className={styles.questionMeta}>
            <span>第 {current + 1} 题 / {questions.length}</span>
            <span>{currentQuestion.category}</span>
            <span>单选题</span>
          </div>
          <h1 className={styles.questionTitle}>{currentQuestion.question}</h1>

          <div className={styles.optionList} role="radiogroup" aria-label="答案选项">
            {currentQuestion.options.map((option, optionIndex) => {
              const chosen = selected === optionIndex
              const correct = showFeedback && currentQuestion.answer === optionIndex
              const wrong = showFeedback && chosen && !correct
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  className={`${styles.option} ${chosen ? styles.optionChosen : ''} ${correct ? styles.optionCorrect : ''} ${wrong ? styles.optionWrong : ''}`}
                  onClick={() => choose(optionIndex)}
                >
                  <span className={styles.optionLetter}>{LETTERS[optionIndex]}</span>
                  <span>{option}</span>
                  {correct ? <IconCheck className={styles.optionMark} size={21} /> : null}
                  {wrong ? <IconX className={styles.optionMark} size={21} /> : null}
                </button>
              )
            })}
          </div>

          {showFeedback ? (
            <div className={selected === currentQuestion.answer ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
              <strong>{selected === currentQuestion.answer ? '回答正确' : '再记一遍正确答案'}</strong>
              <span>{LETTERS[currentQuestion.answer]}. {currentQuestion.options[currentQuestion.answer]}</span>
            </div>
          ) : null}

          <div className={styles.questionActions}>
            <button type="button" className={styles.secondaryButton} disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
              <IconArrowLeft size={17} /> 上一题
            </button>
            {mode === 'exam' && current === questions.length - 1 ? (
              <button type="button" className={styles.submitButton} onClick={finishExam}><IconFlag size={17} /> 交卷</button>
            ) : (
              <button type="button" className={styles.primaryButton} disabled={isLearning && selected === undefined} onClick={nextQuestion}>
                下一题 <IconArrowRight size={17} />
              </button>
            )}
          </div>
          <p className={styles.keyboardHint}>键盘快捷键：1—4 选择答案，← → 切换题目</p>
        </section>

        <aside className={styles.navigator}>
          <div className={styles.navigatorHead}>
            <div><span>答题卡</span><strong>{answeredCount}/{questions.length}</strong></div>
            {mode === 'exam' ? <button type="button" onClick={finishExam}>提前交卷</button> : null}
          </div>
          <div className={styles.numberGrid}>
            {questions.map((question, index) => {
              const answer = answers[question.id]
              const answered = answer !== undefined
              const answerCorrect = isLearning && answered && answer === question.answer
              const answerWrong = isLearning && answered && answer !== question.answer
              return (
                <button
                  key={question.id}
                  type="button"
                  aria-label={`第 ${index + 1} 题${answered ? '，已作答' : '，未作答'}`}
                  className={`${index === current ? styles.numberCurrent : ''} ${answered ? styles.numberAnswered : ''} ${answerCorrect ? styles.numberCorrect : ''} ${answerWrong ? styles.numberWrong : ''}`}
                  onClick={() => setCurrent(index)}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          <div className={styles.legend}>
            <span><i className={styles.legendCurrent} /> 当前</span>
            <span><i className={styles.legendAnswered} /> 已答</span>
            <span><i /> 未答</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
