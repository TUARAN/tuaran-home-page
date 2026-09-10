'use client'

import dynamic from 'next/dynamic'

// PPT generation requires browser APIs and must never be compiled into Edge SSR.
const DownloadPptButton = dynamic(() => import('./DownloadPptButtonClient'), { ssr: false })
export default DownloadPptButton
