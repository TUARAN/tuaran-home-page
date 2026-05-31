import LayoutChromeControls, { LayoutChromeFooter } from './LayoutChromeControls'

export default function LayoutChrome({ children }) {
  return (
    <>
      <LayoutChromeControls />
      <div className="flex w-full min-w-0 flex-1 flex-col [&>*]:min-w-0 [&>*]:w-full">{children}</div>
      <LayoutChromeFooter />
    </>
  )
}
