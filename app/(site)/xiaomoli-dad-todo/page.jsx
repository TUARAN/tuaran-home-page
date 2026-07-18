import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import DadTodoClient from './DadTodoClient'

export const metadata = createRichPageMetadata('xiaomoli-dad-todo')

export default function XiaomoliDadTodoPage() {
  return <><RichPageJsonLd pageId="xiaomoli-dad-todo" /><DadTodoClient /></>
}
