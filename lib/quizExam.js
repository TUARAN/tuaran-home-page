export function shuffle(items, random = Math.random) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export function shuffleQuestionOptions(question, random = Math.random) {
  if (question?.type === 'fill' || !Array.isArray(question?.options)) return question

  const shuffledOptions = shuffle(
    question.options.map((option, originalIndex) => ({ option, originalIndex })),
    random,
  )

  return {
    ...question,
    options: shuffledOptions.map(({ option }) => option),
    answer: shuffledOptions.findIndex(({ originalIndex }) => originalIndex === question.answer),
  }
}

export function buildExamQuestions(questionBank, examSize, random = Math.random) {
  const fillQuestion = questionBank.find((question) => question.type === 'fill')
  const choiceQuestions = questionBank.filter((question) => question.type !== 'fill')
  const selectedChoices = shuffle(choiceQuestions, random)
    .slice(0, examSize - (fillQuestion ? 1 : 0))
    .map((question) => shuffleQuestionOptions(question, random))

  return [
    ...selectedChoices,
    ...(fillQuestion ? [fillQuestion] : []),
  ]
}
