export default function AboutPage() {
  return (
    <main className="relative isolate min-h-dvh">
      {/* Background */}
      <div aria-hidden="true" className="absolute inset-x-0 top-4 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
          }}
          className="aspect-1108/632 w-277 flex-none bg-linear-to-r from-[#ff80b5] to-[#e11d48] opacity-25"
        />
      </div>

      {/* Header section */}
      <div className="px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl pt-24 text-center sm:pt-40">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">We love creators</h1>
          <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat
            fugiat.
          </p>
        </div>
      </div>
    </main>
  );
}
