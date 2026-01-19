const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does Ignidash provide financial advice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Ignidash is an educational tool for retirement planning simulations—not a substitute for personalized advice from a qualified financial, tax, or legal professional.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Ignidash available outside the United States?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not yet. Right now, Ignidash only supports planning in US dollars (USD) with US tax laws and retirement accounts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Ignidash free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All core planning tools are completely free during beta, but will be $7/month after. Access to AI features requires a paid subscription. Self-hosting with Docker is free forever.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my financial data secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Your data is encrypted and stored securely using Convex, a database platform with enterprise-grade security. We never sell your information.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to connect my bank and investment accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Ignidash works entirely with data you manually input, and never requires connecting external accounts. This gives you full control over what you share.',
      },
    },
    {
      '@type': 'Question',
      name: 'What AI does Ignidash use, and is my data used to train it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ignidash uses GPT-5.2 from Microsoft Azure OpenAI, which has stricter privacy protections than consumer OpenAI. Your data is never used for training or shared with third parties.',
      },
    },
  ],
};

const faqs = [
  {
    question: 'Does Ignidash provide financial advice?',
    answer:
      'No. Ignidash is an educational tool for retirement planning simulations—not a substitute for personalized advice from a qualified financial, tax, or legal professional.',
  },
  {
    question: 'Is Ignidash available outside the United States?',
    answer: 'Not yet. Right now, Ignidash only supports planning in US dollars (USD) with US tax laws and retirement accounts.',
  },
  {
    question: 'Is Ignidash free to use?',
    answer: (
      <>
        All core planning tools are completely free during beta, but will be $7/month after. Access to AI features requires a paid
        subscription.{' '}
        <a
          href="https://github.com/schelskedevco/ignidash"
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Self-hosting with Docker
        </a>{' '}
        is free forever.
      </>
    ),
  },
  {
    question: 'Is my financial data secure?',
    answer:
      'Yes! Your data is encrypted and stored securely using Convex, a database platform with enterprise-grade security. We never sell your information.',
  },
  {
    question: 'Do I need to connect my bank and investment accounts?',
    answer:
      'No. Ignidash works entirely with data you manually input, and never requires connecting external accounts. This gives you full control over what you share.',
  },
  {
    question: 'What AI does Ignidash use, and is my data used to train it?',
    answer: (
      <>
        Ignidash uses GPT-5.2 from{' '}
        <a
          href="https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy"
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Microsoft Azure OpenAI
        </a>
        , which has stricter privacy protections than consumer OpenAI. Your data is never used for training or shared with third parties.
      </>
    ),
  },
];

export default function FAQSection() {
  return (
    <div id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="mx-auto max-w-2xl px-6 py-24 sm:pt-32 lg:max-w-7xl lg:px-8 lg:py-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 className="text-3xl font-semibold tracking-tight text-pretty text-stone-900 sm:text-4xl dark:text-white">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base/7 text-pretty text-stone-600 dark:text-stone-400">
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
                  <dt className="text-base/7 font-semibold text-stone-900 dark:text-white">{faq.question}</dt>
                  <dd className="mt-2 text-base/7 text-stone-600 dark:text-stone-400">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
