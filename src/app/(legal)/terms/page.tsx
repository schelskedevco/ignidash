import type { Metadata } from 'next';
import { HandshakeIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Ignidash. Read our guidelines on acceptable use, limitations, and user responsibilities.',
  openGraph: {
    title: 'Terms of Service - Ignidash',
    description: 'Terms and conditions for using Ignidash. Read our guidelines on acceptable use, limitations, and user responsibilities.',
  },
};

export default function TermsPage() {
  return (
    <main className="border-border/50 lg:bg-emphasized-background mx-auto min-h-dvh max-w-prose px-2 pt-[4.25rem] pb-[2.125rem] sm:px-3 lg:border-x lg:px-4">
      <header className="my-8">
        <div className="flex items-center gap-4">
          <HandshakeIcon className="text-primary h-12 w-12" />
          <div>
            <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground text-sm">Last updated: December 22, 2025</p>
          </div>
        </div>
      </header>
      <article className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">Agreement to Our Legal Terms</h2>
          <p className="mb-4">
            We are <strong>Schelske Dev Co. LLC</strong> (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; &quot;our&quot;), a company
            registered in Minnesota, United States at 11101 Harrison Ave S, Minneapolis, MN 55437.
          </p>
          <p className="mb-4">
            We operate the website{' '}
            <a href="https://www.ignidash.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              ignidash.com
            </a>{' '}
            (the &quot;Site&quot;), as well as any other related products and services that refer or link to these legal terms (the
            &quot;Legal Terms&quot;) (collectively, the &quot;Services&quot;).
          </p>
          <p className="mb-4">
            This app is a financial planning tool that helps users model, visualize, and understand their long-term financial future through
            projections and scenario planning with AI assistance. The Service is provided for informational and educational purposes only
            and does not constitute financial, investment, tax, legal, or other professional advice. It is not a substitute for licensed
            professional services, and Ignidash does not have a fiduciary duty to you. All decisions based on information from the Service
            are your sole responsibility.
          </p>
          <p className="mb-4">
            You can contact us by phone at 952-242-5109, email at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            , or by mail to 11101 Harrison Ave S, Minneapolis, MN 55437, United States.
          </p>
          <p className="mb-4">
            These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity
            (&quot;you&quot;), and Schelske Dev Co. LLC, concerning your access to and use of the Services. You agree that by accessing the
            Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE
            LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </p>
          <p className="mb-4">
            We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will
            become effective upon posting or notifying you by{' '}
            <a href="mailto:notice@mail.ignidash.com" className="text-primary hover:underline">
              notice@mail.ignidash.com
            </a>
            , as stated in the email message. By continuing to use the Services after the effective date of any changes, you agree to be
            bound by the modified terms.
          </p>
          <p className="mb-4">
            The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or
            register for the Services.
          </p>
          <p>We recommend that you print a copy of these Legal Terms for your records.</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">Table of Contents</h2>
          <ol className="list-inside list-decimal space-y-2 uppercase">
            <li>
              <a href="#services" className="text-primary hover:underline">
                Our Services
              </a>
            </li>
            <li>
              <a href="#ip" className="text-primary hover:underline">
                Intellectual Property Rights
              </a>
            </li>
            <li>
              <a href="#userreps" className="text-primary hover:underline">
                User Representations
              </a>
            </li>
            <li>
              <a href="#userreg" className="text-primary hover:underline">
                User Registration
              </a>
            </li>
            <li>
              <a href="#purchases" className="text-primary hover:underline">
                Purchases and Payment
              </a>
            </li>
            <li>
              <a href="#subscriptions" className="text-primary hover:underline">
                Subscriptions
              </a>
            </li>
            <li>
              <a href="#prohibited" className="text-primary hover:underline">
                Prohibited Activities
              </a>
            </li>
            <li>
              <a href="#ugc" className="text-primary hover:underline">
                User Generated Contributions
              </a>
            </li>
            <li>
              <a href="#license" className="text-primary hover:underline">
                Contribution License
              </a>
            </li>
            <li>
              <a href="#socialmedia" className="text-primary hover:underline">
                Social Media
              </a>
            </li>
            <li>
              <a href="#thirdparty" className="text-primary hover:underline">
                Third-Party Websites and Content
              </a>
            </li>
            <li>
              <a href="#sitemanage" className="text-primary hover:underline">
                Services Management
              </a>
            </li>
            <li>
              <a href="#ppyes" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#terms" className="text-primary hover:underline">
                Term and Termination
              </a>
            </li>
            <li>
              <a href="#modifications" className="text-primary hover:underline">
                Modifications and Interruptions
              </a>
            </li>
            <li>
              <a href="#law" className="text-primary hover:underline">
                Governing Law
              </a>
            </li>
            <li>
              <a href="#disputes" className="text-primary hover:underline">
                Dispute Resolution
              </a>
            </li>
            <li>
              <a href="#corrections" className="text-primary hover:underline">
                Corrections
              </a>
            </li>
            <li>
              <a href="#disclaimer" className="text-primary hover:underline">
                Disclaimer
              </a>
            </li>
            <li>
              <a href="#liability" className="text-primary hover:underline">
                Limitations of Liability
              </a>
            </li>
            <li>
              <a href="#indemnification" className="text-primary hover:underline">
                Indemnification
              </a>
            </li>
            <li>
              <a href="#userdata" className="text-primary hover:underline">
                User Data
              </a>
            </li>
            <li>
              <a href="#electronic" className="text-primary hover:underline">
                Electronic Communications, Transactions, and Signatures
              </a>
            </li>
            <li>
              <a href="#california" className="text-primary hover:underline">
                California Users and Residents
              </a>
            </li>
            <li>
              <a href="#misc" className="text-primary hover:underline">
                Miscellaneous
              </a>
            </li>
            <li>
              <a href="#addclause" className="text-primary hover:underline">
                Nature of Service and Disclaimer of Financial Advice
              </a>
            </li>
            <li>
              <a href="#addclauseb" className="text-primary hover:underline">
                User Responsibility and Consultation with Professionals
              </a>
            </li>
            <li>
              <a href="#addclausec" className="text-primary hover:underline">
                Accuracy of Projections
              </a>
            </li>
            <li>
              <a href="#addclaused" className="text-primary hover:underline">
                AI-Generated Educational Content and Limitations
              </a>
            </li>
            <li>
              <a href="#contact" className="text-primary hover:underline">
                Contact Us
              </a>
            </li>
          </ol>
        </section>

        <section id="services" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">1. Our Services</h2>
          <p className="mb-4">
            The information provided when using the Services is not intended for distribution to or use by any person or entity in any
            jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any
            registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from
            other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent
            local laws are applicable.
          </p>
          <p>
            The Services are not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act
            (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws,
            you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).
          </p>
        </section>

        <section id="ip" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">2. Intellectual Property Rights</h2>

          <h3 className="my-6 text-xl font-semibold">Our intellectual property</h3>
          <p className="mb-4">
            We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases,
            functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the
            &quot;Content&quot;), as well as the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;).
          </p>
          <p className="mb-4">
            Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair
            competition laws) and treaties in the United States and around the world.
          </p>
          <p>The Content and Marks are provided in or through the Services &quot;AS IS&quot; for your personal, non-commercial use only.</p>

          <h3 className="my-6 text-xl font-semibold">Your use of our Services</h3>
          <p className="mb-4">
            Subject to your compliance with these Legal Terms, including the &quot;
            <a href="#prohibited" className="text-primary hover:underline">
              PROHIBITED ACTIVITIES
            </a>
            &quot; section below, we grant you a non-exclusive, non-transferable, revocable license to:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>access the Services; and</li>
            <li>download or print a copy of any portion of the Content to which you have properly gained access,</li>
          </ul>
          <p className="mb-4">solely for your personal, non-commercial use.</p>
          <p className="mb-4">
            Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be
            copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted,
            distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written
            permission.
          </p>
          <p className="mb-4">
            If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal
            Terms, please address your request to:{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            . If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must
            identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice
            appears or is visible on posting, reproducing, or displaying our Content.
          </p>
          <p className="mb-4">We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.</p>
          <p>
            Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our
            Services will terminate immediately.
          </p>

          <h3 className="my-6 text-xl font-semibold">Your submissions</h3>
          <p className="mb-4">
            Please review this section and the &quot;
            <a href="#prohibited" className="text-primary hover:underline">
              PROHIBITED ACTIVITIES
            </a>
            &quot; section carefully prior to using our Services to understand the (a) rights you give us and (b) obligations you have when
            you post or upload any content through the Services.
          </p>
          <p className="mb-4">
            <strong>Submissions:</strong> By directly sending us any question, comment, suggestion, idea, feedback, or other information
            about the Services (&quot;Submissions&quot;), you agree to assign to us all intellectual property rights in such Submission. You
            agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose,
            commercial or otherwise, without acknowledgment or compensation to you.
          </p>
          <p className="mb-4">
            <strong>You are responsible for what you post or upload:</strong> By sending us Submissions through any part of the Services
            you:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              confirm that you have read and agree with our &quot;
              <a href="#prohibited" className="text-primary hover:underline">
                PROHIBITED ACTIVITIES
              </a>
              &quot; and will not post, send, publish, upload, or transmit through the Services any Submission that is illegal, harassing,
              hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually
              explicit, false, inaccurate, deceitful, or misleading;
            </li>
            <li>to the extent permissible by applicable law, waive any and all moral rights to any such Submission;</li>
            <li>
              warrant that any such Submission are original to you or that you have the necessary rights and licenses to submit such
              Submissions and that you have full authority to grant us the above-mentioned rights in relation to your Submissions; and
            </li>
            <li>warrant and represent that your Submissions do not constitute confidential information.</li>
          </ul>
          <p>
            You are solely responsible for your Submissions and you expressly agree to reimburse us for any and all losses that we may
            suffer because of your breach of (a) this section, (b) any third party&apos;s intellectual property rights, or (c) applicable
            law.
          </p>
        </section>

        <section id="userreps" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">3. User Representations</h2>
          <p className="mb-4">
            By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate,
            current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information
            as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the
            jurisdiction in which you reside; (5) you will not access the Services through automated or non-human means, whether through a
            bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorized purpose; and (7) your use of the
            Services will not violate any applicable law or regulation.
          </p>
          <p className="mt-4">
            If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate
            your account and refuse any and all current or future use of the Services (or any portion thereof).
          </p>
        </section>

        <section id="userreg" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">4. User Registration</h2>
          <p>
            You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for
            all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine,
            in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
          </p>
        </section>

        <section id="purchases" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">5. Purchases and Payment</h2>
          <p className="mb-4">We accept the following forms of payment:</p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>Visa</li>
            <li>Mastercard</li>
            <li>American Express</li>
            <li>Discover</li>
            <li>PayPal</li>
          </ul>
          <p className="mb-4">
            You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services.
            You further agree to promptly update account and payment information, including email address, payment method, and payment card
            expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of
            purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.
          </p>
          <p className="mb-4">
            You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize
            us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any
            errors or mistakes in pricing, even if we have already requested or received payment.
          </p>
          <p>
            We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities
            purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer
            account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or
            prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.
          </p>
        </section>

        <section id="subscriptions" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">6. Subscriptions</h2>

          <h3 className="my-6 text-xl font-semibold">Billing and Renewal</h3>
          <p className="mb-4">
            Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a
            recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable
            order. The length of your billing cycle will depend on the type of subscription plan you choose when you subscribed to the
            Services.
          </p>

          <h3 className="my-6 text-xl font-semibold">Free Trial</h3>
          <p className="mb-4">
            We offer a 7-day free trial to new users who register with the Services. The account will be charged according to the
            user&apos;s chosen subscription at the end of the free trial.
          </p>

          <h3 className="my-6 text-xl font-semibold">Cancellation</h3>
          <p className="mb-4">
            All purchases are non-refundable. You can cancel your subscription at any time by logging into your account. Your cancellation
            will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please
            email us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            .
          </p>

          <h3 className="my-6 text-xl font-semibold">Fee Changes</h3>
          <p>
            We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with
            applicable law.
          </p>
        </section>

        <section id="prohibited" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">7. Prohibited Activities</h2>
          <p className="mb-4">
            You may not access or use the Services for any purpose other than that for which we make the Services available. The Services
            may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>
          <p className="mb-4">As a user of the Services, you agree not to:</p>
          <ul className="ml-4 list-outside list-disc space-y-2">
            <li>
              Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection,
              compilation, database, or directory without written permission from us.
            </li>
            <li>
              Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user
              passwords.
            </li>
            <li>
              Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or
              restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained
              therein.
            </li>
            <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
            <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
            <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
            <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
            <li>Engage in unauthorized framing of or linking to the Services.</li>
            <li>
              Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of
              capital letters and spamming (continuous posting of repetitive text), that interferes with any party&apos;s uninterrupted use
              and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions,
              operation, or maintenance of the Services.
            </li>
            <li>
              Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining,
              robots, or similar data gathering and extraction tools.
            </li>
            <li>Delete the copyright or other proprietary rights notice from any Content.</li>
            <li>Attempt to impersonate another user or person or use the username of another user.</li>
            <li>
              Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection
              or transmission mechanism, including without limitation, clear graphics interchange formats (&quot;gifs&quot;), 1×1 pixels,
              web bugs, cookies, or other similar devices (sometimes referred to as &quot;spyware&quot; or &quot;passive collection
              mechanisms&quot; or &quot;pcms&quot;).
            </li>
            <li>
              Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.
            </li>
            <li>
              Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.
            </li>
            <li>
              Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the
              Services.
            </li>
            <li>Copy or adapt the Services&apos; software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
            <li>
              Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or
              in any way making up a part of the Services.
            </li>
            <li>
              Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any
              automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the
              Services, or use or launch any unauthorized script or other software.
            </li>
            <li>Use a buying agent or purchasing agent to make purchases on the Services.</li>
            <li>
              Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or
              other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false
              pretenses.
            </li>
            <li>
              Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any
              revenue-generating endeavor or commercial enterprise.
            </li>
            <li>Use the Services to advertise or offer to sell goods and services.</li>
            <li>Sell or otherwise transfer your profile.</li>
          </ul>
        </section>

        <section id="ugc" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">8. User Generated Contributions</h2>
          <p className="mb-4">
            The Services does not offer users to submit or post content. We may provide you with the opportunity to create, submit, post,
            display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not
            limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material
            (collectively, &quot;Contributions&quot;). Contributions may be viewable by other users of the Services and through third-party
            websites. As such, any Contributions you transmit may be treated in accordance with the Services&apos; Privacy Policy. When you
            create or make available any Contributions, you thereby represent and warrant that:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your
              Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent,
              trademark, trade secret, or moral rights of any third party.
            </li>
            <li>
              You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to use and to
              authorize us, the Services, and other users of the Services to use your Contributions in any manner contemplated by the
              Services and these Legal Terms.
            </li>
            <li>
              You have the written consent, release, and/or permission of each and every identifiable individual person in your
              Contributions to use the name or likeness of each and every such identifiable individual person to enable inclusion and use of
              your Contributions in any manner contemplated by the Services and these Legal Terms.
            </li>
            <li>Your Contributions are not false, inaccurate, or misleading.</li>
            <li>
              Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters,
              spam, mass mailings, or other forms of solicitation.
            </li>
            <li>
              Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise
              objectionable (as determined by us).
            </li>
            <li>Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.</li>
            <li>
              Your Contributions are not used to harass or threaten (in the legal sense of those terms) any other person and to promote
              violence against a specific person or class of people.
            </li>
            <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
            <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
            <li>
              Your Contributions do not violate any applicable law concerning child pornography, or otherwise intended to protect the health
              or well-being of minors.
            </li>
            <li>
              Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual
              preference, or physical handicap.
            </li>
            <li>
              Your Contributions do not otherwise violate, or link to material that violates, any provision of these Legal Terms, or any
              applicable law or regulation.
            </li>
          </ul>
          <p>
            Any use of the Services in violation of the foregoing violates these Legal Terms and may result in, among other things,
            termination or suspension of your rights to use the Services.
          </p>
        </section>

        <section id="license" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">9. Contribution License</h2>
          <p className="mb-4">
            You and Services agree that we may access, store, process, and use any information and personal data that you provide following
            the terms of the Privacy Policy and your choices (including settings).
          </p>
          <p className="mb-4">
            By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any
            purpose without compensation to you.
          </p>
          <p>
            We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any
            intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any
            statements or representations in your Contributions provided by you in any area on the Services. You are solely responsible for
            your Contributions to the Services and you expressly agree to exonerate us from any and all responsibility and to refrain from
            any legal action against us regarding your Contributions.
          </p>
        </section>

        <section id="socialmedia" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">10. Social Media</h2>
          <p className="mb-4">
            As part of the functionality of the Services, you may link your account with online accounts you have with third-party service
            providers (each such account, a &quot;Third-Party Account&quot;) by either: (1) providing your Third-Party Account login
            information through the Services; or (2) allowing us to access your Third-Party Account, as is permitted under the applicable
            terms and conditions that govern your use of each Third-Party Account.
          </p>
          <p className="mb-4">
            You represent and warrant that you are entitled to disclose your Third-Party Account login information to us and/or grant us
            access to your Third-Party Account, without breach by you of any of the terms and conditions that govern your use of the
            applicable Third-Party Account, and without obligating us to pay any fees or making us subject to any usage limitations imposed
            by the third-party service provider of the Third-Party Account.
          </p>
          <p className="mb-4">
            By granting us access to any Third-Party Accounts, you understand that (1) we may access, make available, and store (if
            applicable) any content that you have provided to and stored in your Third-Party Account (the &quot;Social Network
            Content&quot;) so that it is available on and through the Services via your account, including without limitation any friend
            lists and (2) we may submit to and receive from your Third-Party Account additional information to the extent you are notified
            when you link your account with the Third-Party Account.
          </p>
          <p className="mb-4">
            Depending on the Third-Party Accounts you choose and subject to the privacy settings that you have set in such Third-Party
            Accounts, personally identifiable information that you post to your Third-Party Accounts may be available on and through your
            account on the Services. Please note that if a Third-Party Account or associated service becomes unavailable or our access to
            such Third-Party Account is terminated by the third-party service provider, then Social Network Content may no longer be
            available on and through the Services.
          </p>
          <p className="mb-4">
            You will have the ability to disable the connection between your account on the Services and your Third-Party Accounts at any
            time. PLEASE NOTE THAT YOUR RELATIONSHIP WITH THE THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR THIRD-PARTY ACCOUNTS IS
            GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS.
          </p>
          <p className="mb-4">
            We make no effort to review any Social Network Content for any purpose, including but not limited to, for accuracy, legality, or
            non-infringement, and we are not responsible for any Social Network Content. You acknowledge and agree that we may access your
            email address book associated with a Third-Party Account and your contacts list stored on your mobile device or tablet computer
            solely for purposes of identifying and informing you of those contacts who have also registered to use the Services.
          </p>
          <p>
            You can deactivate the connection between the Services and your Third-Party Account by contacting us using the contact
            information below or through your account settings (if applicable). We will attempt to delete any information stored on our
            servers that was obtained through such Third-Party Account, except the username and profile picture that become associated with
            your account.
          </p>
        </section>

        <section id="thirdparty" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">11. Third-Party Websites and Content</h2>
          <p className="mb-4">
            The Services may contain (or you may be sent via the Site) links to other websites (&quot;Third-Party Websites&quot;) as well as
            articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other
            content or items belonging to or originating from third parties (&quot;Third-Party Content&quot;).
          </p>
          <p className="mb-4">
            Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or
            completeness by us, and we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party
            Content posted on, available through, or installed from the Services, including the content, accuracy, offensiveness, opinions,
            reliability, privacy practices, or other policies of or contained in the Third-Party Websites or the Third-Party Content.
          </p>
          <p className="mb-4">
            Inclusion of, linking to, or permitting the use or installation of any Third-Party Websites or any Third-Party Content does not
            imply approval or endorsement thereof by us. If you decide to leave the Services and access the Third-Party Websites or to use
            or install any Third-Party Content, you do so at your own risk, and you should be aware these Legal Terms no longer govern.
          </p>
          <p className="mb-4">
            You should review the applicable terms and policies, including privacy and data gathering practices, of any website to which you
            navigate from the Services or relating to any applications you use or install from the Services. Any purchases you make through
            Third-Party Websites will be through other websites and from other companies, and we take no responsibility whatsoever in
            relation to such purchases which are exclusively between you and the applicable third party.
          </p>
          <p>
            You agree and acknowledge that we do not endorse the products or services offered on Third-Party Websites and you shall hold us
            blameless from any harm caused by your purchase of such products or services. Additionally, you shall hold us blameless from any
            losses sustained by you or harm caused to you relating to or resulting in any way from any Third-Party Content or any contact
            with Third-Party Websites.
          </p>
        </section>

        <section id="sitemanage" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">12. Services Management</h2>
          <p>
            We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take
            appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without
            limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse,
            restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or
            any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or
            otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5)
            otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning
            of the Services.
          </p>
        </section>

        <section id="ppyes" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">13. Privacy Policy</h2>
          <p className="mb-4">
            We care about data privacy and security. Please review our Privacy Policy:{' '}
            <a href="https://www.ignidash.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              https://www.ignidash.com/privacy
            </a>
            . By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be
            advised the Services are hosted in the United States, Germany and Singapore.
          </p>
          <p>
            If you access the Services from any other region of the world with laws or other requirements governing personal data
            collection, use, or disclosure that differ from applicable laws in the United States, Germany and Singapore, then through your
            continued use of the Services, you are transferring your data to the United States, Germany and Singapore, and you expressly
            consent to have your data transferred to and processed in the United States, Germany and Singapore.
          </p>
        </section>

        <section id="terms" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">14. Term and Termination</h2>
          <p className="mb-4">
            These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF
            THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF
            THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT
            LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR
            REGULATION.
          </p>
          <p className="mb-4">
            WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED
            AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.
          </p>
          <p>
            If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under
            your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In
            addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without
            limitation pursuing civil, criminal, and injunctive redress.
          </p>
        </section>

        <section id="modifications" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">15. Modifications and Interruptions</h2>
          <p className="mb-4">
            We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole
            discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to
            you or any third party for any modification, price change, suspension, or discontinuance of the Services.
          </p>
          <p>
            We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need
            to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change,
            revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You
            agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the
            Services during any downtime or discontinuance of the Services. Nothing in these Legal Terms will be construed to obligate us to
            maintain and support the Services or to supply any corrections, updates, or releases in connection therewith.
          </p>
        </section>

        <section id="law" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">16. Governing Law</h2>
          <p>
            These Legal Terms and your use of the Services are governed by and construed in accordance with the laws of the State of
            Minnesota applicable to agreements made and to be entirely performed within the State of Minnesota, without regard to its
            conflict of law principles.
          </p>
        </section>

        <section id="disputes" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">17. Dispute Resolution</h2>

          <h3 className="my-6 text-xl font-semibold">Informal Negotiations</h3>
          <p className="mb-4">
            To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a
            &quot;Dispute&quot; and collectively, the &quot;Disputes&quot;) brought by either you or us (individually, a &quot;Party&quot;
            and collectively, the &quot;Parties&quot;), the Parties agree to first attempt to negotiate any Dispute (except those Disputes
            expressly provided below) informally for at least thirty (30) days before initiating arbitration. Such informal negotiations
            commence upon written notice from one Party to the other Party.
          </p>

          <h3 className="my-6 text-xl font-semibold">Binding Arbitration</h3>
          <p className="mb-4">
            If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute (except those Disputes expressly
            excluded below) will be finally and exclusively resolved by binding arbitration. YOU UNDERSTAND THAT WITHOUT THIS PROVISION, YOU
            WOULD HAVE THE RIGHT TO SUE IN COURT AND HAVE A JURY TRIAL.
          </p>
          <p className="mb-4">
            The arbitration shall be commenced and conducted under the Commercial Arbitration Rules of the American Arbitration Association
            (&quot;AAA&quot;) and, where appropriate, the AAA&apos;s Supplementary Procedures for Consumer Related Disputes (&quot;AAA
            Consumer Rules&quot;), both of which are available at the{' '}
            <a href="http://www.adr.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              American Arbitration Association (AAA) website
            </a>
            . Your arbitration fees and your share of arbitrator compensation shall be governed by the AAA Consumer Rules and, where
            appropriate, limited by the AAA Consumer Rules. If such costs are determined by the arbitrator to be excessive, we will pay all
            arbitration fees and expenses.
          </p>
          <p className="mb-4">
            The arbitration may be conducted in person, through the submission of documents, by phone, or online. The arbitrator will make a
            decision in writing, but need not provide a statement of reasons unless requested by either Party. The arbitrator must follow
            applicable law, and any award may be challenged if the arbitrator fails to do so. Except where otherwise required by the
            applicable AAA rules or applicable law, the arbitration will take place in Hennepin, Minnesota.
          </p>
          <p className="mb-4">
            Except as otherwise provided herein, the Parties may litigate in court to compel arbitration, stay proceedings pending
            arbitration, or to confirm, modify, vacate, or enter judgment on the award entered by the arbitrator.
          </p>
          <p className="mb-4">
            If for any reason, a Dispute proceeds in court rather than arbitration, the Dispute shall be commenced or prosecuted in the
            state and federal courts located in Hennepin, Minnesota, and the Parties hereby consent to, and waive all defenses of lack of
            personal jurisdiction, and forum non conveniens with respect to venue and jurisdiction in such state and federal courts.
            Application of the United Nations Convention on Contracts for the International Sale of Goods and the Uniform Computer
            Information Transaction Act (UCITA) are excluded from these Legal Terms.
          </p>
          <p className="mb-4">
            In no event shall any Dispute brought by either Party related in any way to the Services be commenced more than one (1) years
            after the cause of action arose. If this provision is found to be illegal or unenforceable, then neither Party will elect to
            arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable and such Dispute shall
            be decided by a court of competent jurisdiction within the courts listed for jurisdiction above, and the Parties agree to submit
            to the personal jurisdiction of that court.
          </p>

          <h3 className="my-6 text-xl font-semibold">Restrictions</h3>
          <p className="mb-4">
            The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent
            permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any
            Dispute to be arbitrated on a class-action basis or to utilize class action procedures; and (c) there is no right or authority
            for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.
          </p>

          <h3 className="my-6 text-xl font-semibold">Exceptions to Informal Negotiations and Arbitration</h3>
          <p>
            The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations binding
            arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property
            rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or
            unauthorized use; and (c) any claim for injunctive relief. If this provision is found to be illegal or unenforceable, then
            neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or
            unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction
            above, and the Parties agree to submit to the personal jurisdiction of that court.
          </p>
        </section>

        <section id="corrections" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">18. Corrections</h2>
          <p>
            There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions,
            pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and
            to change or update the information on the Services at any time, without prior notice.
          </p>
        </section>

        <section id="disclaimer" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">19. Disclaimer</h2>
          <p>
            THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK.
            TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR
            USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES&apos; CONTENT OR
            THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR
            ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE
            WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS
            AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF
            TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH
            THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF
            ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES. WE DO
            NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY
            THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING,
            AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY
            PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU
            SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.
          </p>
        </section>

        <section id="liability" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">20. Limitations of Liability</h2>
          <p>
            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT,
            CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER
            DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING
            ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE
            ACTION, WILL AT ALL TIMES BE LIMITED TO THE LESSER OF THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD
            PRIOR TO ANY CAUSE OF ACTION ARISING OR $250.00 USD. CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON
            IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE
            DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
          </p>
        </section>

        <section id="indemnification" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">21. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective
            officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable
            attorneys&apos; fees and expenses, made by any third party due to or arising out of: (1) use of the Services; (2) breach of
            these Legal Terms; (3) any breach of your representations and warranties set forth in these Legal Terms; (4) your violation of
            the rights of a third party, including but not limited to intellectual property rights; or (5) any overt harmful act toward any
            other user of the Services with whom you connected via the Services. Notwithstanding the foregoing, we reserve the right, at
            your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you
            agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such
            claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.
          </p>
        </section>

        <section id="userdata" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">22. User Data</h2>
          <p>
            We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as
            well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely
            responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree
            that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action
            against us arising from any such loss or corruption of such data.
          </p>
        </section>

        <section id="electronic" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">23. Electronic Communications, Transactions, and Signatures</h2>
          <p>
            Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to
            receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide
            to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU
            HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES,
            POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES. You hereby waive any rights or
            requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original
            signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than
            electronic means.
          </p>
        </section>

        <section id="california" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">24. California Users and Residents</h2>
          <p>
            If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of
            Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112,
            Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
          </p>
        </section>

        <section id="misc" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">25. Miscellaneous</h2>
          <p>
            These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the
            entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal
            Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by
            law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any
            loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a
            provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is
            deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There
            is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms
            or use of the Services. You agree that these Legal Terms will not be construed against us by virtue of having drafted them. You
            hereby waive any and all defenses you may have based on the electronic form of these Legal Terms and the lack of signing by the
            parties hereto to execute these Legal Terms.
          </p>
        </section>

        <section id="addclause" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">26. Nature of Service and Disclaimer of Financial Advice</h2>
          <p className="mb-4">
            Ignidash is a financial planning tool that enables users to create projections, models, and scenarios for educational and
            informational purposes only. We do not act as a financial advisor, investment advisor, broker-dealer, or any other regulated
            financial services provider, and we do not provide investment advice, recommendations, or endorsements of any specific
            securities, investment strategies, or financial products.
          </p>
          <p>
            All projections, calculations, and scenarios generated through the Service are hypothetical and should not be relied upon as
            predictions of actual future performance. Tax calculations are based on current tax laws and rates, which are subject to change,
            and do not constitute tax advice.
          </p>
        </section>

        <section id="addclauseb" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">27. User Responsibility and Consultation with Professionals</h2>
          <p className="mb-4">
            You are solely responsible for your own financial decisions. Before making significant financial decisions, you should consult
            with qualified financial, tax, and legal professionals who can evaluate your specific circumstances.
          </p>
          <p>
            You acknowledge that any financial decisions you make based on information from the Service are made at your sole discretion and
            risk.
          </p>
        </section>

        <section id="addclausec" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">28. Accuracy of Projections</h2>
          <p>
            The accuracy and completeness of any projections or scenarios generated by the Service is not guaranteed. Projections depend on
            the accuracy and completeness of the information you provide, as well as assumptions and models that may not reflect actual
            outcomes. You are responsible for ensuring all information you input is accurate and up-to-date. Ignidash does not verify the
            accuracy of user inputs.
          </p>
        </section>

        <section id="addclaused" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">29. AI-Generated Educational Content and Limitations</h2>
          <p className="mb-4">
            The Service includes AI-powered features that provide general educational information about financial planning concepts relevant
            to your plan. All AI-generated content is for informational and educational purposes only and does not constitute financial,
            investment, tax, legal, or any other form of professional advice.
          </p>
          <p>
            AI features identify topics based on elements present in your plan but do not analyze your specific circumstances or make
            personalized recommendations. AI-generated content may contain errors, inaccuracies, or outdated information, and we make no
            warranties regarding its accuracy, completeness, or reliability. You should verify any information obtained through AI features
            and consult with qualified professionals before making financial decisions based on such content.
          </p>
        </section>

        <section id="contact" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">29. Contact Us</h2>
          <p className="mb-4">
            In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please
            contact us at:
          </p>
          <address className="not-italic">
            <strong>Schelske Dev Co. LLC</strong>
            <br />
            11101 Harrison Ave S<br />
            Minneapolis, MN 55437
            <br />
            United States
            <br />
            Phone: 952-242-5109
            <br />
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
          </address>
        </section>
      </article>
    </main>
  );
}
