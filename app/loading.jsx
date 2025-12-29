export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="border-b border-[#eee] pb-4 mb-8">
        <div className="h-8 w-56 bg-[#eee]" />
        <div className="h-4 w-72 bg-[#eee] mt-2" />
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <main className="flex-1">
          <div className="h-6 w-28 bg-[#eee] mb-4" />
          <ul className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="h-4 w-4 bg-[#eee] mt-1" />
                <div className="flex-1">
                  <div className="h-4 w-full bg-[#eee]" />
                </div>
              </li>
            ))}
          </ul>
        </main>

        <aside className="w-full md:w-64">
          <div className="border border-[#eee] bg-white p-4">
            <div className="h-4 w-20 bg-[#eee] mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-[#eee]" />
              <div className="h-4 w-5/6 bg-[#eee]" />
              <div className="h-4 w-4/6 bg-[#eee]" />
            </div>
            <div className="mt-4 h-24 w-20 max-w-full bg-[#eee]" />
          </div>
        </aside>
      </div>

      <footer className="mt-16 pt-8 border-t border-[#eee]">
        <div className="h-4 w-40 bg-[#eee] mx-auto" />
      </footer>
    </div>
  )
}
