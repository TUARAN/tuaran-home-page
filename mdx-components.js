import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'

const baseComponents = getNextraComponents()

export function useMDXComponents(components = {}) {
  return { ...baseComponents, ...components }
}
