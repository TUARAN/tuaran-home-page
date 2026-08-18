'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconClock,
  IconFlag,
  IconNotebook,
  IconRefresh,
  IconTargetArrow,
  IconX,
} from '@tabler/icons-react'

import { QUESTION_BANK_2026, QUESTION_BANK_META } from '../../../lib/questionBank2026'
import styles from './quiz.module.css'

const LETTERS = ['A', 'B', 'C', 'D']
const WRONG_BOOK_STORAGE_KEY = 'quiz:wrong-book:2026:v1'
const EXAM_CONFIG = {
  20: 30 * 60,
  50: 60 * 60,
  101: 120 * 60,
}

function normalizeFillAnswer(value) {
  return String(value || '')
    .replace(/[\s，。；、！？“”‘’：,.!?;:'"]/g, '')
    .trim()
}

function isAnswered(question, value) {
  if (question?.type === 'fill') return Boolean(String(value || '').trim())
  return Number.isInteger(value)
}

function isCorrect(question, value) {
  if (question?.type === 'fill') {
    return normalizeFillAnswer(value) === normalizeFillAnswer(question.answerText)
  }
  return value === question?.answer
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
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [wrongQuestionIds, setWrongQuestionIds] = useState([])
  const [wrongBookReady, setWrongBookReady] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(EXAM_CONFIG[20])

  const currentQuestion = questions[current]
  const answeredCount = questions.reduce(
    (total, question) => total + (isAnswered(question, answers[question.id]) ? 1 : 0),
    0,
  )
  const correctCount = useMemo(
    () => questions.reduce((total, question) => total + (isCorrect(question, answers[question.id]) ? 1 : 0), 0),
    [answers, questions],
  )
  const wrongQuestions = useMemo(
    () => questions.filter((question) => !isCorrect(question, answers[question.id])),
    [answers, questions],
  )
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  const finishExam = useCallback(() => {
    const wrongIds = questions
      .filter((question) => !isCorrect(question, answers[question.id]))
      .map((question) => question.id)
    setWrongQuestionIds((previous) => Array.from(new Set([...previous, ...wrongIds])))
    setSubmitted(true)
  }, [answers, questions])

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(WRONG_BOOK_STORAGE_KEY) || '[]')
      const validIds = Array.isArray(stored)
        ? stored.filter((id) => QUESTION_BANK_2026.some((question) => question.id === Number(id))).map(Number)
        : []
      setWrongQuestionIds(Array.from(new Set(validIds)))
    } catch {
      setWrongQuestionIds([])
    } finally {
      setWrongBookReady(true)
    }
  }, [])

  useEffect(() => {
    if (!wrongBookReady) return
    window.localStorage.setItem(WRONG_BOOK_STORAGE_KEY, JSON.stringify(wrongQuestionIds))
  }, [wrongBookReady, wrongQuestionIds])

  useEffect(() => {
    if (!['learn', 'review'].includes(mode) || !currentQuestion) return
    const value = answers[currentQuestion.id]
    if (!isAnswered(currentQuestion, value)) return
    if (currentQuestion.type === 'fill' && !revealedAnswers[currentQuestion.id]) return

    const correct = isCorrect(currentQuestion, value)
    setWrongQuestionIds((previous) => {
      if (!correct) return previous.includes(currentQuestion.id) ? previous : [...previous, currentQuestion.id]
      if (mode !== 'review') return previous
      return previous.filter((id) => id !== currentQuestion.id)
    })
  }, [answers, currentQuestion, mode, revealedAnswers])

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
      if (['INPUT', 'TEXTAREA'].includes(event.target?.tagName)) return
      const option = Number(event.key) - 1
      if (option >= 0 && option <= 3 && currentQuestion?.type !== 'fill') {
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
    setRevealedAnswers({})
    setCurrent(0)
    setSubmitted(false)
  }

  function startExam() {
    const fillQuestion = QUESTION_BANK_2026.find((question) => question.type === 'fill')
    const choiceQuestions = QUESTION_BANK_2026.filter((question) => question.type !== 'fill')
    setMode('exam')
    setQuestions([
      ...shuffle(choiceQuestions).slice(0, examSize - (fillQuestion ? 1 : 0)),
      ...(fillQuestion ? [fillQuestion] : []),
    ])
    setAnswers({})
    setRevealedAnswers({})
    setCurrent(0)
    setSubmitted(false)
    setTimeLeft(EXAM_CONFIG[examSize])
  }

  function startWrongReview() {
    const wrongQuestions = QUESTION_BANK_2026.filter((question) => wrongQuestionIds.includes(question.id))
    if (!wrongQuestions.length) return
    setMode('review')
    setQuestions(wrongQuestions)
    setAnswers({})
    setRevealedAnswers({})
    setCurrent(0)
    setSubmitted(false)
  }

  function returnHome() {
    setMode('home')
    setAnswers({})
    setRevealedAnswers({})
    setCurrent(0)
    setSubmitted(false)
  }

  function choose(optionIndex) {
    if (!currentQuestion || currentQuestion.type === 'fill' || submitted) return
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionIndex }))
  }

  function updateFillAnswer(value) {
    if (!currentQuestion || currentQuestion.type !== 'fill' || submitted) return
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }))
    setRevealedAnswers((previous) => ({ ...previous, [currentQuestion.id]: false }))
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
                <span><strong>101</strong> 道题目</span>
                <span><strong>3</strong> 个知识板块</span>
                <span><strong>3</strong> 种学习模式</span>
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
              {[20, 50, 101].map((size) => (
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

          <button
            type="button"
            className={`${styles.modeCard} ${styles.wrongCard}`}
            onClick={startWrongReview}
            disabled={!wrongQuestionIds.length}
          >
            <div className={styles.modeIndex}>03</div>
            <div className={styles.modeIcon}><IconNotebook size={25} stroke={1.7} /></div>
            <h2>错题学习</h2>
            <p>集中复习学习和考试中答错的题目。再次答对后，题目会自动移出错题本。</p>
            <span className={styles.wrongCount}>
              <strong>{wrongQuestionIds.length}</strong>
              {wrongQuestionIds.length ? ' 道待复习' : ' 暂无错题'}
            </span>
            <span className={styles.modeAction}>
              {wrongQuestionIds.length ? '开始复习' : '完成答题后自动收录'}
              {wrongQuestionIds.length ? <IconArrowRight size={18} /> : null}
            </span>
          </button>
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
            <span>74—101</span>
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
            {wrongQuestions.length ? ' 错题已自动收录到错题学习。' : ''}
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
                  你的答案：{!isAnswered(question, answers[question.id])
                    ? '未作答'
                    : question.type === 'fill'
                      ? answers[question.id]
                      : `${LETTERS[answers[question.id]]}. ${question.options[answers[question.id]]}`}
                </p>
                <p className={styles.rightAnswer}>
                  <IconCheck size={17} />
                  参考答案：{question.type === 'fill'
                    ? question.answerText
                    : `${LETTERS[question.answer]}. ${question.options[question.answer]}`}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    )
  }

  const selected = answers[currentQuestion.id]
  const isLearning = mode === 'learn' || mode === 'review'
  const isWrongReview = mode === 'review'
  const isFillQuestion = currentQuestion.type === 'fill'
  const showFeedback = isLearning && (
    isFillQuestion ? Boolean(revealedAnswers[currentQuestion.id]) : isAnswered(currentQuestion, selected)
  )
  const currentIsCorrect = isCorrect(currentQuestion, selected)

  return (
    <main className={`${styles.page} ${styles.quizPage}`}>
      <header className={styles.quizHeader}>
        <button type="button" className={styles.textButton} onClick={returnHome}><IconArrowLeft size={17} /> 退出</button>
        <div className={styles.headerTitle}>
          <span>{isWrongReview ? 'WRONG BOOK' : isLearning ? 'LEARNING MODE' : 'EXAM MODE'}</span>
          <strong>{isWrongReview ? '错题学习' : isLearning ? '学习模式' : `${questions.length} 题考试`}</strong>
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
            <span>{isFillQuestion ? '填空题' : '单选题'}</span>
          </div>
          <h1 className={styles.questionTitle}>{currentQuestion.question}</h1>

          {isFillQuestion ? (
            <div className={styles.fillAnswerWrap}>
              <label htmlFor={`fill-answer-${currentQuestion.id}`}>请在下方完整默写</label>
              <textarea
                id={`fill-answer-${currentQuestion.id}`}
                value={selected || ''}
                onChange={(event) => updateFillAnswer(event.target.value)}
                rows={8}
                spellCheck={false}
                placeholder="我志愿加入中国共产党……"
              />
              <span>{String(selected || '').replace(/\s/g, '').length} 字</span>
            </div>
          ) : (
            <div className={styles.optionList} role="radiogroup" aria-label="答案选项">
            {currentQuestion.options.map((option, optionIndex) => {
              const chosen = selected === optionIndex
              const correct = showFeedback && currentQuestion.answer === optionIndex
              const wrong = showFeedback && chosen && !correct
              return (
                <button
                  key={`${currentQuestion.id}-${optionIndex}`}
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
          )}

          {showFeedback ? (
            <div className={currentIsCorrect ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
              <strong>{currentIsCorrect
                ? isWrongReview ? '回答正确，已移出错题本' : '回答正确'
                : isWrongReview ? '仍需复习，保留在错题本' : '请对照参考答案再记一遍'}</strong>
              <span>{isFillQuestion
                ? currentQuestion.answerText
                : `${LETTERS[currentQuestion.answer]}. ${currentQuestion.options[currentQuestion.answer]}`}</span>
            </div>
          ) : null}

          <div className={styles.questionActions}>
            <button type="button" className={styles.secondaryButton} disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
              <IconArrowLeft size={17} /> 上一题
            </button>
            {isLearning && isFillQuestion && !showFeedback ? (
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!isAnswered(currentQuestion, selected)}
                onClick={() => setRevealedAnswers((previous) => ({ ...previous, [currentQuestion.id]: true }))}
              >
                核对答案 <IconCheck size={17} />
              </button>
            ) : mode === 'exam' && current === questions.length - 1 ? (
              <button type="button" className={styles.submitButton} onClick={finishExam}><IconFlag size={17} /> 交卷</button>
            ) : isLearning && current === questions.length - 1 ? (
              <button type="button" className={styles.primaryButton} onClick={returnHome}>
                完成学习 <IconCheck size={17} />
              </button>
            ) : (
              <button type="button" className={styles.primaryButton} disabled={isLearning && !isAnswered(currentQuestion, selected)} onClick={nextQuestion}>
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
              const answered = isAnswered(question, answer)
              const answerCorrect = isLearning && answered && isCorrect(question, answer)
              const answerWrong = isLearning && answered && !isCorrect(question, answer)
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
