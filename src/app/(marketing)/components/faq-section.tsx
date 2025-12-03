const faqs = [
  {
    question: 'Can Ignidash give me advice about what stocks to invest in?',
    answer:
      "No. Ignidash is a tool for simulating your financial future and planning your retirement—we don't provide any personalized investment advice. For that, please consult with a licensed financial advisor.",
  },
  {
    question: 'Can I use Ignidash outside the US?',
    answer:
      'Not yet. Right now, Ignidash only supports planning in USD ($) using US tax laws and retirement accounts. International support is on our roadmap.',
  },
  {
    question: 'Is my financial data secure?',
    answer:
      'Yes. Your data is encrypted and stored securely using Convex, a database platform with enterprise-grade security. We never sell your information. When you use AI features, only your financial numbers are shared with AI providers—no personally identifying information.',
  },
  {
    question: 'Do I need to connect my bank and investment accounts?',
    answer:
      "No. Ignidash works entirely with data you manually input. You're never required to link external accounts, giving you full control over what you share.",
  },
  {
    question: 'Is Ignidash free to use?',
    answer:
      "Ignidash is currently free while in beta. At launch, we'll offer a 7-day free trial, then plans starting at $11/month for Pro and $15/month for Pro + AI with advanced features.",
  },
];

export default function FAQSection() {
  return (
    <div id="faq">
      <div className="mx-auto max-w-2xl px-6 py-24 sm:pt-32 lg:max-w-7xl lg:px-8 lg:py-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 className="text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-white">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base/7 text-pretty text-zinc-600 dark:text-zinc-400">
              Can&apos;t find the answer you&apos;re looking for? Reach out to our{' '}
              <a
                href="mailto:joe@schelske.dev"
                className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
              >
                customer support
              </a>{' '}
              team (which is just me).
            </p>
          </div>
          <div className="mt-10 lg:col-span-7 lg:mt-0">
            <dl className="space-y-10">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-base/7 font-semibold text-zinc-900 dark:text-white">{faq.question}</dt>
                  <dd className="mt-2 text-base/7 text-zinc-600 dark:text-zinc-400">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
