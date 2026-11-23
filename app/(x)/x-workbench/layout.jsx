import { SharedSessionProvider } from './sharedSession'

export default function XWorkbenchLayout({ children }) {
  return <SharedSessionProvider>{children}</SharedSessionProvider>
}
