import OperatorClient from '../OperatorClient'

export const metadata = {
  title: { absolute: '账号与插件' },
  alternates: { canonical: '/x-workbench/ops' },
  robots: { index: false, follow: false },
}

export default function XWorkbenchOpsPage() {
  return <OperatorClient />
}
