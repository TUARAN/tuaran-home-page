import LayoutChromeControls, { LayoutChromeFooter } from './LayoutChromeControls'
import RichPageFrame from './RichPageFrame'

export default function LayoutChrome({ children }) {
  return (
    <>
      <LayoutChromeControls />
      <div className="site-public-content flex w-full min-w-0 flex-1 flex-col [&>*]:min-w-0 [&>*]:w-full">
        <RichPageFrame>{children}</RichPageFrame>
      </div>
      <LayoutChromeFooter />
    </>
  )
}
