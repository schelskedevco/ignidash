import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="relative isolate min-h-dvh">
      <div aria-hidden="true" className="absolute inset-x-0 top-4 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
          }}
          className="aspect-1108/632 w-277 flex-none bg-linear-to-r from-[#ff80b5] to-[#e11d48] opacity-25"
        />
      </div>

      <div className="px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl pt-24 text-center sm:pt-40">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
            The <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">Future</span> of{' '}
            <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">FIRE.</span>
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
            An introduction to Ignidash and how it came to be.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="mx-auto grid max-w-xl grid-cols-1 gap-8 text-base/7 text-gray-600 lg:max-w-none lg:grid-cols-2 dark:text-gray-300">
            <div>
              <p>
                My name is{' '}
                <a
                  href="https://www.linkedin.com/in/scheljos/"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Joe Schelske
                </a>
                , I&apos;m 26 years old and the founder of{' '}
                <Link href="/" className="text-primary hover:underline">
                  Ignidash.com
                </Link>
                . After quitting my engineering job at Meta to pursue &quot;something else&quot; (not yet knowing what that would be), I
                would talk to ChatGPT about my interests and finances to explore different life, career, and financial plans that seemed
                appealing.
              </p>
              <p className="mt-8">
                While these AI conversations were great for explaining retirement planning concepts and brainstorming career path ideas, I
                quickly realized that the mathematical side of financial planning was not something that LLMs were particularly well-suited
                for on their own.
              </p>
            </div>
            <div>
              <p>
                At this point, I wanted a tool that could run accurate, comprehensive long-term financial simulations to make up for the
                computational shortcomings of AI, but also had AI-powered assistance features to help me understand the results and explore
                ways to fine-tune the plan according to my interests and values.
              </p>
              <p className="mt-8">
                Enter Ignidash: the personal finance app that gets the math right and helps you make sense of it all so you can plan your
                future with confidence. Ready to get started?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Create your free account
                </Link>{' '}
                today!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
