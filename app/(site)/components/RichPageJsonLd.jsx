import { createRichPageJsonLd } from '../../../lib/richPageSeo'

export default function RichPageJsonLd({ pageId }) {
  const json = JSON.stringify(createRichPageJsonLd(pageId)).replaceAll('<', '\\u003c')

  return (
    <script
      id={`rich-page-jsonld-${pageId}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
