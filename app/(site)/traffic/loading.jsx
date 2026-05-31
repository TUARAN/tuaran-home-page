export default function Loading() {
  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-8 w-32 bg-[#eee] dark:bg-gray-800" />
            <div className="h-4 w-56 bg-[#eee] dark:bg-gray-800 mt-3" />
          </div>
        </div>
      </header>

      <section>
        <div className="w-full h-[80vh] min-h-[640px] bg-[#f5f5f5] dark:bg-gray-900 border border-[#eee] dark:border-gray-800 animate-pulse" />
      </section>
    </div>
  )
}
