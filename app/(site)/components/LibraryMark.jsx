export default function LibraryMark({ size = 24, stroke = 1.8, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9.5 12 4l9 5.5H3Z" />
      <path d="M4 10v9m16-9v9M7 11v7m10-7v7M3 20h18" />
      <path d="M10 12.5c.8-.35 1.5-.35 2 0v4.2c-.5 0-1.2 0-2 .35v-4.55Zm2 0c.5 0 1.2 0 2 .35v4.2c-.8-.35-1.5-.35-2-.35" strokeWidth="1.2" />
    </svg>
  )
}
