import type { Metadata } from 'next';
import { GlobeLockIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Ignidash collects, uses, and protects your data. Your financial information is encrypted and never sold.',
  openGraph: {
    title: 'Privacy Policy - Ignidash',
    description: 'How Ignidash collects, uses, and protects your data. Your financial information is encrypted and never sold.',
  },
};

export default function PrivacyPage() {
  return (
    <main className="border-border/50 lg:bg-emphasized-background mx-auto min-h-dvh max-w-prose px-2 pt-[4.25rem] pb-[2.125rem] sm:px-3 lg:border-x lg:px-4">
      <header className="my-8">
        <div className="flex items-center gap-4">
          <GlobeLockIcon className="text-primary h-12 w-12" />
          <div>
            <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: December 31, 2025</p>
          </div>
        </div>
      </header>
      <article className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none">
        <section className="mb-8">
          <p className="mb-4">
            This Privacy Notice for <strong>Schelske Dev Co. LLC</strong> (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), describes
            how and why we might access, collect, store, use, and/or share (&quot;process&quot;) your personal information when you use our
            services (&quot;Services&quot;), including when you:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              Visit our website at{' '}
              <a href="https://www.ignidash.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                ignidash.com
              </a>{' '}
              or any website of ours that links to this Privacy Notice
            </li>
            <li>
              Use Ignidash. The app is a financial planning tool that helps users model, visualize, and understand their long-term financial
              future through projections and scenario planning with AI assistance.
            </li>
            <li>Engage with us in other related ways, including any sales, marketing, or events</li>
          </ul>
          <p className="mb-4">
            <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We
            are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and
            practices, please do not use our Services. If you still have any questions or concerns, please contact us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">Summary of Key Points</h2>
          <p className="mb-4 italic">
            <strong>
              This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by
              clicking the link following each key point or by using our{' '}
              <a href="#tableofcontents" className="text-primary hover:underline">
                table of contents
              </a>{' '}
              below to find the section you are looking for.
            </strong>
          </p>
          <p className="mb-4">
            <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal
            information depending on how you interact with us and the Services, the choices you make, and the products and features you use.
            Learn more about{' '}
            <a href="#infocollect" className="text-primary hover:underline">
              personal information you disclose to us
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>Do we process any sensitive personal information?</strong> Some of the information may be considered &quot;special&quot;
            or &quot;sensitive&quot; in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious
            beliefs. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable
            law. Learn more about{' '}
            <a href="#sensitiveinfo" className="text-primary hover:underline">
              sensitive information we process
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>Do we collect any information from third parties?</strong> We may collect information from public databases, marketing
            partners, social media platforms, and other outside sources. Learn more about{' '}
            <a href="#othersources" className="text-primary hover:underline">
              information collected from other sources
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our
            Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information
            for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more
            about{' '}
            <a href="#infouse" className="text-primary hover:underline">
              how we process your information
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>In what situations and with which types of parties do we share personal information?</strong> We may share information
            in specific situations and with specific categories of third parties. Learn more about{' '}
            <a href="#whoshare" className="text-primary hover:underline">
              when and with whom we share your personal information
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in
            place to protect your personal information. However, no electronic transmission over the internet or information storage
            technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other
            unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your
            information. Learn more about{' '}
            <a href="#infosafe" className="text-primary hover:underline">
              how we keep your information safe
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean
            you have certain rights regarding your personal information. Learn more about{' '}
            <a href="#privacyrights" className="text-primary hover:underline">
              your privacy rights
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by visiting{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            , or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
          </p>
          <p>
            Want to learn more about what we do with any information we collect?{' '}
            <a href="#tableofcontents" className="text-primary hover:underline">
              Review the Privacy Notice in full
            </a>
            .
          </p>
        </section>

        <section id="tableofcontents" className="mb-8 uppercase">
          <h2 className="mb-4 text-2xl font-semibold uppercase">Table of Contents</h2>
          <ol className="list-inside list-decimal space-y-2 uppercase">
            <li>
              <a href="#infocollect" className="text-primary hover:underline">
                What Information Do We Collect?
              </a>
            </li>
            <li>
              <a href="#infouse" className="text-primary hover:underline">
                How Do We Process Your Information?
              </a>
            </li>
            <li>
              <a href="#legalbases" className="text-primary hover:underline">
                What Legal Bases Do We Rely On To Process Your Personal Information?
              </a>
            </li>
            <li>
              <a href="#whoshare" className="text-primary hover:underline">
                When And With Whom Do We Share Your Personal Information?
              </a>
            </li>
            <li>
              <a href="#cookies" className="text-primary hover:underline">
                Do We Use Cookies And Other Tracking Technologies?
              </a>
            </li>
            <li>
              <a href="#ai" className="text-primary hover:underline">
                Do We Offer Artificial Intelligence-Based Products?
              </a>
            </li>
            <li>
              <a href="#sociallogins" className="text-primary hover:underline">
                How Do We Handle Your Social Logins?
              </a>
            </li>
            <li>
              <a href="#intltransfers" className="text-primary hover:underline">
                Is Your Information Transferred Internationally?
              </a>
            </li>
            <li>
              <a href="#inforetain" className="text-primary hover:underline">
                How Long Do We Keep Your Information?
              </a>
            </li>
            <li>
              <a href="#infosafe" className="text-primary hover:underline">
                How Do We Keep Your Information Safe?
              </a>
            </li>
            <li>
              <a href="#infominors" className="text-primary hover:underline">
                Do We Collect Information From Minors?
              </a>
            </li>
            <li>
              <a href="#privacyrights" className="text-primary hover:underline">
                What Are Your Privacy Rights?
              </a>
            </li>
            <li>
              <a href="#DNT" className="text-primary hover:underline">
                Controls For Do-Not-Track Features
              </a>
            </li>
            <li>
              <a href="#uslaws" className="text-primary hover:underline">
                Do United States Residents Have Specific Privacy Rights?
              </a>
            </li>
            <li>
              <a href="#policyupdates" className="text-primary hover:underline">
                Do We Make Updates To This Notice?
              </a>
            </li>
            <li>
              <a href="#contact" className="text-primary hover:underline">
                How Can You Contact Us About This Notice?
              </a>
            </li>
            <li>
              <a href="#request" className="text-primary hover:underline">
                How Can You Review, Update, Or Delete The Data We Collect From You?
              </a>
            </li>
          </ol>
        </section>

        <section id="infocollect" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">1. What Information Do We Collect?</h2>

          <h3 className="my-6 text-xl font-semibold">Personal information you disclose to us</h3>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We collect personal information that you provide to us.
          </p>
          <p className="mb-4">
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in
            obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise
            when you contact us.
          </p>
          <p className="mb-4">
            <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your
            interactions with us and the Services, the choices you make, and the products and features you use. The personal information we
            collect may include the following:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>names</li>
            <li>email addresses</li>
            <li>usernames</li>
            <li>passwords</li>
            <li>contact preferences</li>
            <li>contact or authentication data</li>
            <li>billing addresses</li>
            <li>debit/credit card numbers</li>
            <li>job titles</li>
            <li>income information</li>
            <li>expense information</li>
            <li>financial account/investment information</li>
            <li>age</li>
            <li>financial goals/planning assumptions</li>
          </ul>
          <p className="mb-4" id="sensitiveinfo">
            <strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we
            process the following categories of sensitive information:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>financial data</li>
          </ul>
          <p className="mb-4">
            <strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as
            your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and
            stored by Stripe. You may find their privacy notice here:{' '}
            <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              https://stripe.com/privacy
            </a>
            .
          </p>
          <p className="mb-4">
            <strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social
            media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will
            collect certain profile information about you from the social media provider, as described in the section called &quot;
            <a href="#sociallogins" className="text-primary hover:underline">
              HOW DO WE HANDLE YOUR SOCIAL LOGINS?
            </a>
            &quot; below.
          </p>
          <p>
            All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to
            such personal information.
          </p>

          <h3 className="my-6 text-xl font-semibold">Information automatically collected</h3>
          <p className="mb-4 italic">
            <strong>In Short:</strong> Some information — such as your Internet Protocol (IP) address and/or browser and device
            characteristics — is collected automatically when you visit our Services.
          </p>
          <p className="mb-4">
            We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal
            your specific identity (like your name or contact information) but may include device and usage information, such as your IP
            address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country,
            location, information about how and when you use our Services, and other technical information. This information is primarily
            needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
          </p>
          <p className="mb-4">The information we collect includes:</p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              <strong className="font-semibold italic">Log and Usage Data.</strong> Log and usage data is service-related, diagnostic,
              usage, and performance information our servers automatically collect when you access or use our Services and which we record
              in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser
              type, and settings and information about your activity in the Services (such as the date/time stamps associated with your
              usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information
              (such as system activity, error reports (sometimes called &quot;crash dumps&quot;), and hardware settings).
            </li>
            <li>
              <strong className="font-semibold italic">Device Data.</strong> We collect device data such as information about your computer,
              phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include
              information such as your IP address (or proxy server), device and application identification numbers, location, browser type,
              hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.
            </li>
            <li>
              <strong className="font-semibold italic">Location Data.</strong> We collect location data such as information about your
              device&apos;s location, which can be either precise or imprecise. How much information we collect depends on the type and
              settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect
              geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect
              this information either by refusing access to the information or by disabling your Location setting on your device. However,
              if you choose to opt out, you may not be able to use certain aspects of the Services.
            </li>
          </ul>

          <h3 className="my-6 text-xl font-semibold">Google API</h3>
          <p>
            Our use of information received from Google APIs will adhere to{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-primary hover:underline">
              Google API Services User Data Policy
            </a>
            , including the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy#limited-use"
              className="text-primary hover:underline"
            >
              Limited Use requirements
            </a>
            .
          </p>

          <h3 className="my-6 text-xl font-semibold" id="othersources">
            Information collected from other sources
          </h3>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We may collect limited data from public databases, marketing partners, social media platforms, and
            other outside sources.
          </p>
          <p className="mb-4">
            In order to enhance our ability to provide relevant marketing, offers, and services to you and update our records, we may obtain
            information about you from other sources, such as public databases, joint marketing partners, affiliate programs, data
            providers, social media platforms, and from other third parties. This information includes mailing addresses, job titles, email
            addresses, phone numbers, intent data (or user behavior data), Internet Protocol (IP) addresses, social media profiles, social
            media URLs, and custom profiles, for purposes of targeted advertising and event promotion.
          </p>
          <p className="mb-4">
            If you interact with us on a social media platform using your social media account (e.g., Facebook or X), we receive personal
            information about you from such platforms such as your name, email address, and gender. You may have the right to withdraw your
            consent to processing your personal information. Learn more about{' '}
            <a href="#withdrawconsent" className="text-primary hover:underline">
              withdrawing your consent
            </a>
            . Any personal information that we collect from your social media account depends on your social media account&apos;s privacy
            settings. Please note that their own use of your information is not governed by this Privacy Notice.
          </p>
        </section>

        <section id="infouse" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">2. How Do We Process Your Information?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you,
            for security and fraud prevention, and to comply with law. We process the personal information for the following purposes listed
            below. We may also process your information for other purposes only with your prior explicit consent.
          </p>
          <p className="mb-4">
            <strong>
              We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
            </strong>
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              <strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your
              information so you can create and log in to your account, as well as keep your account in working order.
            </li>
            <li>
              <strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you
              with the requested service.
            </li>
            <li>
              <strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your
              inquiries and solve any potential issues you might have with the requested service.
            </li>
            <li>
              <strong>To send administrative information to you.</strong> We may process your information to send you details about our
              products and services, changes to our terms and policies, and other similar information.
            </li>
            <li>
              <strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders,
              payments, returns, and exchanges made through the Services.
            </li>
            <li>
              <strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you
              about your use of our Services.
            </li>
            <li>
              <strong>To send you marketing and promotional communications.</strong> We may process the personal information you send to us
              for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails
              at any time. For more information, see &quot;
              <a href="#privacyrights" className="text-primary hover:underline">
                WHAT ARE YOUR PRIVACY RIGHTS?
              </a>
              &quot; below.
            </li>
            <li>
              <strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and
              secure, including fraud monitoring and prevention.
            </li>
            <li>
              <strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how
              they are being used so we can improve them.
            </li>
            <li>
              <strong>To save or protect an individual&apos;s vital interest.</strong> We may process your information when necessary to
              save or protect an individual&apos;s vital interest, such as to prevent harm.
            </li>
          </ul>
        </section>

        <section id="legalbases" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">3. What Legal Bases Do We Rely On To Process Your Personal Information?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal
            reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with
            services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business
            interests.
          </p>

          <h3 className="my-6 font-semibold italic underline">If you are located in the EU or UK, this section applies to you.</h3>
          <p className="mb-4">
            The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to
            process your personal information. As such, we may rely on the following legal bases to process your personal information:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              <strong>Consent.</strong> We may process your information if you have given us permission (i.e., consent) to use your personal
              information for a specific purpose. You can withdraw your consent at any time. Learn more about{' '}
              <a href="#withdrawconsent" className="text-primary hover:underline">
                withdrawing your consent
              </a>
              .
            </li>
            <li>
              <strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to
              fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a
              contract with you.
            </li>
            <li>
              <strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably necessary to achieve
              our legitimate business interests and those interests do not outweigh your interests and fundamental rights and freedoms. For
              example, we may process your personal information for some of the purposes described in order to:
              <ul className="mt-2 ml-4 list-outside list-disc space-y-2">
                <li>Send users information about special offers and discounts on our products and services</li>
                <li>Analyze how our Services are used so we can improve them to engage and retain users</li>
                <li>Diagnose problems and/or prevent fraudulent activities</li>
                <li>Understand how our users use our products and services so we can improve user experience</li>
              </ul>
            </li>
            <li>
              <strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our
              legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights,
              or disclose your information as evidence in litigation in which we are involved.
            </li>
            <li>
              <strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital
              interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.
            </li>
          </ul>

          <h3 className="my-6 font-semibold italic underline">If you are located in Canada, this section applies to you.</h3>
          <p className="mb-4">
            We may process your information if you have given us specific permission (i.e., express consent) to use your personal
            information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can{' '}
            <a href="#withdrawconsent" className="text-primary hover:underline">
              withdraw your consent
            </a>{' '}
            at any time.
          </p>
          <p className="mb-4">
            In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent,
            including, for example:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
            <li>For investigations and fraud detection and prevention</li>
            <li>For business transactions provided certain conditions are met</li>
            <li>
              If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim
            </li>
            <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
            <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
            <li>
              If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the
              information and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention
              of the laws of Canada or a province
            </li>
            <li>
              If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of
              records
            </li>
            <li>
              If it was produced by an individual in the course of their employment, business, or profession and the collection is
              consistent with the purposes for which the information was produced
            </li>
            <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
            <li>If the information is publicly available and is specified by the regulations</li>
            <li>
              We may disclose de-identified information for approved research or statistics projects, subject to ethics oversight and
              confidentiality commitments
            </li>
          </ul>
        </section>

        <section id="whoshare" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">4. When And With Whom Do We Share Your Personal Information?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following
            categories of third parties.
          </p>
          <p className="mb-4">
            <strong>Vendors, Consultants, and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors,
            service providers, contractors, or agents (&quot;third parties&quot;) who perform services for us or on our behalf and require
            access to such information to do that work. We have contracts in place with our third parties, which are designed to help
            safeguard your personal information. This means that they cannot do anything with your personal information unless we have
            instructed them to do it. They will also not share your personal information with any organization apart from us. They also
            commit to protect the data they hold on our behalf and to retain it for the period we instruct.
          </p>
          <p className="mb-4">The categories of third parties we may share personal information with are as follows:</p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>Cloud Computing Services</li>
            <li>Data Analytics Services</li>
            <li>Payment Processors</li>
            <li>Website Hosting Service Providers</li>
            <li>Performance Monitoring Tools</li>
            <li>Sales & Marketing Tools</li>
            <li>Data Storage Service Providers</li>
            <li>AI Platforms</li>
            <li>User Account Registration & Authentication Services</li>
          </ul>
          <p className="mb-4">We also may need to share your personal information in the following situations:</p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of,
              any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
            </li>
          </ul>
        </section>

        <section id="cookies" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">5. Do We Use Cookies And Other Tracking Technologies?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We use cookies for product analytics only when you give us consent.
          </p>
          <p className="mb-4">
            We use PostHog, a product analytics platform, to understand how visitors interact with our Services. PostHog helps us analyze
            usage patterns, identify bugs, and improve your experience. We do not use cookies for advertising, retargeting, or tracking you
            across other websites.
          </p>
          <p className="mb-4">
            When you first visit our Services, you will see a cookie banner asking for your consent. No analytics cookies are set until you
            make a choice. If you accept cookies, PostHog will store a first-party cookie in your browser to recognize you across sessions
            and page loads. If you decline cookies, PostHog uses a privacy-preserving method that counts visitors without storing any data
            in your browser—your visit is still recorded for aggregate analytics, but you cannot be identified or tracked across sessions.
          </p>
          <p className="mb-4">
            You can change your cookie preferences at any time by clearing your browser&apos;s cookies and local storage for this site,
            which will cause the consent banner to reappear on your next visit.
          </p>
        </section>

        <section id="ai" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">6. Do We Offer Artificial Intelligence-Based Products?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We offer products, features, or tools powered by artificial intelligence, machine learning, or
            similar technologies.
          </p>
          <p className="mb-4">
            As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar
            technologies (collectively, &quot;AI Products&quot;). These tools are designed to enhance your experience and provide you with
            innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.
          </p>

          <h3 className="my-6 text-xl font-semibold">Use of AI Technologies</h3>
          <p className="mb-4">
            We provide the AI Products through third-party service providers (&quot;AI Service Providers&quot;), including Microsoft Azure
            OpenAI. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by
            these AI Service Providers to enable your use of our AI Products for purposes outlined in &quot;
            <a href="#legalbases" className="text-primary hover:underline">
              WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
            </a>
            &quot; You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.
          </p>
          <p className="mb-4">Your prompts, outputs, and any data processed by our AI Products:</p>
          <ul className="mb-4 ml-4 list-outside list-disc">
            <li>Are NOT available to other customers</li>
            <li>Are NOT available to OpenAI or any third parties</li>
            <li>Are NOT used to train, retrain, or improve any AI foundation models</li>
            <li>Are NOT used to improve Microsoft or third-party products or services</li>
          </ul>
          <p className="mb-4">
            For more information about how Microsoft Azure OpenAI handles data, please see{' '}
            <a
              href="https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft&apos;s Data, Privacy, and Security documentation
            </a>
            .
          </p>

          <h3 className="my-6 text-xl font-semibold">Our AI Products</h3>
          <p className="mb-4">Our AI Products are designed for the following functions:</p>
          <ul className="mb-4 ml-4 list-outside list-disc">
            <li>AI chat</li>
            <li>AI insights</li>
          </ul>

          <h3 className="my-6 text-xl font-semibold">What Data Is Shared With AI</h3>
          <p className="mb-4">When you use our AI Products, we only share the data necessary to provide the AI feature. This includes:</p>
          <ul className="mb-4 ml-4 list-outside list-disc">
            <li>
              <strong>Retirement plan inputs:</strong> ages, income, expenses, account balances, contribution rules, and market assumptions
            </li>
            <li>
              <strong>Tax settings:</strong> filing status and related preferences
            </li>
            <li>
              <strong>Simulation outputs:</strong> your results and calculated metrics
            </li>
          </ul>
          <p className="mb-4">
            <strong>We do NOT share your personal account information with the AI Service Provider.</strong> This includes your name, email
            address, payment information, and authentication data.
          </p>

          <h3 className="my-6 text-xl font-semibold">How We Process Your Data Using AI</h3>
          <p className="mb-4">
            All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with
            Microsoft Azure. Your data is processed within Microsoft&apos;s secure Azure environment with enterprise-grade encryption and
            security controls. The AI models are stateless, meaning no prompts or outputs are stored in the model itself.
          </p>

          <h3 className="my-6 text-xl font-semibold">Your Choice to Use AI Features</h3>
          <p className="mb-4">
            AI features are entirely optional. Your data is not processed by AI unless you actively choose to use our AI Products, such as
            AI chat or AI insights. If you prefer not to have your data processed by AI, simply do not use these features.
          </p>
        </section>

        <section id="sociallogins" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">7. How Do We Handle Your Social Logins?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> If you choose to register or log in to our Services using a social media account, we may have access
            to certain information about you.
          </p>
          <p className="mb-4">
            Our Services offer you the ability to register and log in using your third-party social media account details (like your
            Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media
            provider. The profile information we receive may vary depending on the social media provider concerned, but will often include
            your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a
            social media platform.
          </p>
          <p className="mb-4">
            We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise
            made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your
            personal information by your third-party social media provider. We recommend that you review their privacy notice to understand
            how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and
            apps.
          </p>
        </section>

        <section id="intltransfers" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">8. Is Your Information Transferred Internationally?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We may transfer, store, and process your information in countries other than your own.
          </p>
          <p className="mb-4">
            Our servers are located in the United States, Germany and Singapore. Regardless of your location, please be aware that your
            information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties
            with whom we may share your personal information (see &quot;
            <a href="#whoshare" className="text-primary hover:underline">
              WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </a>
            &quot; above), including facilities in the United States, and other countries.
          </p>
          <p className="mb-4">
            If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not
            necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all
            necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.
          </p>
          <p className="mb-4">
            <strong>European Commission&apos;s Standard Contractual Clauses:</strong>
          </p>
          <p>
            We have implemented measures to protect your personal information, including by using the European Commission&apos;s Standard
            Contractual Clauses for transfers of personal information between our group companies and between us and our third-party
            providers. These clauses require all recipients to protect all personal information that they process originating from the EEA
            or UK in accordance with European data protection laws and regulations. Our Standard Contractual Clauses can be provided upon
            request. We have implemented similar appropriate safeguards with our third-party service providers and partners and further
            details can be provided upon request.
          </p>
        </section>

        <section id="inforetain" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">9. How Long Do We Keep Your Information?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy
            Notice unless otherwise required by law.
          </p>
          <p className="mb-4">
            We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice,
            unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No
            purpose in this notice will require us keeping your personal information for longer than three (3) months past the termination
            of the user&apos;s account.
          </p>
          <p>
            When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such
            information, or, if this is not possible (for example, because your personal information has been stored in backup archives),
            then we will securely store your personal information and isolate it from any further processing until deletion is possible.
          </p>
        </section>

        <section id="infosafe" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">10. How Do We Keep Your Information Safe?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security
            measures.
          </p>
          <p className="mb-4">
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security
            of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic
            transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or
            guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and
            improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal
            information, transmission of personal information to and from our Services is at your own risk. You should only access the
            Services within a secure environment.
          </p>
        </section>

        <section id="infominors" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">11. Do We Collect Information From Minors?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age or the equivalent
            age as specified by law in your jurisdiction.
          </p>
          <p className="mb-4">
            We do not knowingly collect, solicit data from, or market to children under 18 years of age or the equivalent age as specified
            by law in your jurisdiction, nor do we knowingly sell such personal information. By using the Services, you represent that you
            are at least 18 or the equivalent age as specified by law in your jurisdiction or that you are the parent or guardian of such a
            minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than
            18 years of age or the equivalent age as specified by law in your jurisdiction has been collected, we will deactivate the
            account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have
            collected from children under age 18 or the equivalent age as specified by law in your jurisdiction, please contact us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            .
          </p>
        </section>

        <section id="privacyrights" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">12. What Are Your Privacy Rights?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> Depending on your state of residence in the US or in some regions, such as the European Economic Area
            (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your
            personal information. You may review, change, or terminate your account at any time, depending on your country, province, or
            state of residence.
          </p>
          <p className="mb-4">
            In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws.
            These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification
            or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not
            to be subject to automated decision-making. If a decision that produces legal or similarly significant effects is made solely by
            automated means, we will inform you, explain the main factors, and offer a simple way to request human review. In certain
            circumstances, you may also have the right to object to the processing of your personal information. You can make such a request
            by contacting us by using the contact details provided in the section &quot;
            <a href="#contact" className="text-primary hover:underline">
              HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </a>
            &quot; below.
          </p>
          <p className="mb-4">We will consider and act upon any request in accordance with applicable data protection laws.</p>
          <p className="mb-4">
            If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the
            right to complain to your{' '}
            <a
              href="https://ec.europa.eu/newsroom/article29/items/612080/en"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Member State data protection authority
            </a>{' '}
            or{' '}
            <a
              href="https://ico.org.uk/make-a-complaint/data-protection-complaints/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              UK data protection authority
            </a>
            .
          </p>
          <p className="mb-4">
            If you are located in Switzerland, you may contact the{' '}
            <a href="https://www.edoeb.admin.ch/en" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Federal Data Protection and Information Commissioner
            </a>
            .
          </p>
          <p className="mb-4" id="withdrawconsent">
            <strong className="underline">Withdrawing your consent:</strong> If we are relying on your consent to process your personal
            information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your
            consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the
            section &quot;
            <a href="#contact" className="text-primary hover:underline">
              HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </a>
            &quot; below or updating your preferences.
          </p>
          <p className="mb-4">
            However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law
            allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than
            consent.
          </p>
          <p className="mb-4">
            <strong className="underline">Opting out of marketing and promotional communications:</strong> You can unsubscribe from our
            marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, or by
            contacting us using the details provided in the section &quot;
            <a href="#contact" className="text-primary hover:underline">
              HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </a>
            &quot; below. You will then be removed from the marketing lists. However, we may still communicate with you — for example, to
            send you service-related messages that are necessary for the administration and use of your account, to respond to service
            requests, or for other non-marketing purposes.
          </p>

          <h3 className="my-6 text-xl font-semibold">Account Information</h3>
          <p className="mb-4">
            If you would at any time like to review or change the information in your account or terminate your account, you can:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc">
            <li>Log in to your account settings and update your user account.</li>
          </ul>
          <p className="mb-4">
            Upon your request to terminate your account, we will deactivate or delete your account and information from our active
            databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any
            investigations, enforce our legal terms and/or comply with applicable legal requirements.
          </p>
          <p className="mb-4">
            <strong className="underline">Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default.
            If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove
            cookies or reject cookies, this could affect certain features or services of our Services.
          </p>
          <p>
            If you have questions or comments about your privacy rights, you may email us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            .
          </p>
        </section>

        <section id="DNT" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">13. Controls For Do-Not-Track Features</h2>
          <p className="mb-4">
            Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or
            setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and
            collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As
            such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not
            to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about
            that practice in a revised version of this Privacy Notice.
          </p>
          <p>
            California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry
            or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.
          </p>
        </section>

        <section id="uslaws" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">14. Do United States Residents Have Specific Privacy Rights?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa,
            Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or
            Virginia, you may have the right to request access to and receive details about the personal information we maintain about you
            and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the
            right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances
            by applicable law. More information is provided below.
          </p>

          <h3 className="my-6 text-xl font-semibold">Categories of Personal Information We Collect</h3>
          <p className="mb-4">
            The table below shows the categories of personal information we have collected in the past twelve (12) months. The table
            includes illustrative examples of each category and does not reflect the personal information we collect from you. For a
            comprehensive inventory of all personal information we process, please refer to the section &quot;
            <a href="#infocollect" className="text-primary hover:underline">
              WHAT INFORMATION DO WE COLLECT?
            </a>
            &quot;
          </p>
          <div className="mb-4 overflow-x-auto">
            <table className="bg-background min-w-full border-collapse border border-zinc-300">
              <thead>
                <tr>
                  <th className="border border-zinc-300 px-4 py-2 text-left">Category</th>
                  <th className="border border-zinc-300 px-4 py-2 text-left">Examples</th>
                  <th className="border border-zinc-300 px-4 py-2 text-left">Collected</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">A. Identifiers</td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal
                    identifier, online identifier, Internet Protocol address, email address, and account name
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">YES</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">
                    B. Personal information as defined in the California Customer Records statute
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Name, contact information, education, employment, employment history, and financial information
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">YES</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">
                    C. Protected classification characteristics under state or federal law
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">YES</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">D. Commercial information</td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Transaction information, purchase history, financial details, and payment information
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">YES</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">E. Biometric information</td>
                  <td className="border border-zinc-300 px-4 py-2">Fingerprints and voiceprints</td>
                  <td className="border border-zinc-300 px-4 py-2">NO</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">F. Internet or other similar network activity</td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Browsing history, search history, online behavior, interest data, and interactions with our and other websites,
                    applications, systems, and advertisements
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">NO</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">G. Geolocation data</td>
                  <td className="border border-zinc-300 px-4 py-2">Device location</td>
                  <td className="border border-zinc-300 px-4 py-2">NO</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">H. Audio, electronic, sensory, or similar information</td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Images and audio, video or call recordings created in connection with our business activities
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">NO</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">I. Professional or employment-related information</td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Business contact details in order to provide you our Services at a business level or job title, work history, and
                    professional qualifications if you apply for a job with us
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">YES</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">J. Education Information</td>
                  <td className="border border-zinc-300 px-4 py-2">Student records and directory information</td>
                  <td className="border border-zinc-300 px-4 py-2">NO</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">K. Inferences drawn from collected personal information</td>
                  <td className="border border-zinc-300 px-4 py-2">
                    Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for
                    example, an individual&apos;s preferences and characteristics
                  </td>
                  <td className="border border-zinc-300 px-4 py-2">NO</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-2">L. Sensitive personal Information</td>
                  <td className="border border-zinc-300 px-4 py-2">Account login information</td>
                  <td className="border border-zinc-300 px-4 py-2">YES</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4">
            We only collect sensitive personal information, as defined by applicable privacy laws or the purposes allowed by law or with
            your consent. Sensitive personal information may be used, or disclosed to a service provider or contractor, for additional,
            specified purposes. You may have the right to limit the use or disclosure of your sensitive personal information. We do not
            collect or process sensitive personal information for the purpose of inferring characteristics about you.
          </p>
          <p className="mb-4">
            We may also collect other personal information outside of these categories through instances where you interact with us in
            person, online, or by phone or mail in the context of:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>Receiving help through our customer support channels;</li>
            <li>Participation in customer surveys or contests; and</li>
            <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
          </ul>
          <p className="mb-4">We will use and retain the collected personal information as needed to provide the Services or for:</p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>Category A - As long as the user has an account with us</li>
            <li>Category B - As long as the user has an account with us</li>
            <li>Category C - As long as the user has an account with us</li>
            <li>Category D - As long as the user has an account with us</li>
            <li>Category I - As long as the user has an account with us</li>
            <li>Category L - As long as the user has an account with us</li>
          </ul>

          <h3 className="my-6 text-xl font-semibold">Sources of Personal Information</h3>
          <p className="mb-4">
            Learn more about the sources of personal information we collect in &quot;
            <a href="#infocollect" className="text-primary hover:underline">
              WHAT INFORMATION DO WE COLLECT?
            </a>
            &quot;
          </p>

          <h3 className="my-6 text-xl font-semibold">How We Use and Share Personal Information</h3>
          <p className="mb-4">
            Learn more about how we use your personal information in the section, &quot;
            <a href="#infouse" className="text-primary hover:underline">
              HOW DO WE PROCESS YOUR INFORMATION?
            </a>
            &quot;
          </p>
          <p className="mb-4">
            <strong>Will your information be shared with anyone else?</strong>
          </p>
          <p className="mb-4">
            We may disclose your personal information with our service providers pursuant to a written contract between us and each service
            provider. Learn more about how we disclose personal information to in the section, &quot;
            <a href="#whoshare" className="text-primary hover:underline">
              WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </a>
            &quot;
          </p>
          <p className="mb-4">
            We may use your personal information for our own business purposes, such as for undertaking internal research for technological
            development and demonstration. This is not considered to be &quot;selling&quot; of your personal information.
          </p>
          <p className="mb-4">
            We have not sold or shared any personal information to third parties for a business or commercial purpose in the preceding
            twelve (12) months. We have disclosed the following categories of personal information to third parties for a business or
            commercial purpose in the preceding twelve (12) months:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>Category A. Identifiers</li>
            <li>Category B. Personal information as defined in the California Customer Records law</li>
            <li>Category L. Sensitive personal information</li>
          </ul>
          <p className="mb-4">
            The categories of third parties to whom we disclosed personal information for a business or commercial purpose can be found
            under &quot;
            <a href="#whoshare" className="text-primary hover:underline">
              WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </a>
            &quot;
          </p>

          <h3 className="my-6 text-xl font-semibold">Your Rights</h3>
          <p className="mb-4">
            You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we
            may decline your request as permitted by law. These rights include:
          </p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              <strong>Right to know</strong> whether or not we are processing your personal data
            </li>
            <li>
              <strong>Right to access</strong> your personal data
            </li>
            <li>
              <strong>Right to correct</strong> inaccuracies in your personal data
            </li>
            <li>
              <strong>Right to request</strong> the deletion of your personal data
            </li>
            <li>
              <strong>Right to obtain a copy</strong> of the personal data you previously shared with us
            </li>
            <li>
              <strong>Right to non-discrimination</strong> for exercising your rights
            </li>
            <li>
              <strong>Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising (or sharing
              as defined under California&apos;s privacy law), the sale of personal data, or profiling in furtherance of decisions that
              produce legal or similarly significant effects (&quot;profiling&quot;)
            </li>
          </ul>
          <p className="mb-4">Depending upon the state where you live, you may also have the following rights:</p>
          <ul className="mb-4 ml-4 list-outside list-disc space-y-2">
            <li>
              Right to access the categories of personal data being processed (as permitted by applicable law, including the privacy law in
              Minnesota)
            </li>
            <li>
              Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable
              law, including the privacy law in California, Delaware, and Maryland)
            </li>
            <li>
              Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law,
              including the privacy law in Minnesota and Oregon)
            </li>
            <li>
              Right to obtain a list of third parties to which we have sold personal data (as permitted by applicable law, including the
              privacy law in Connecticut)
            </li>
            <li>
              Right to review, understand, question, and depending on where you live, correct how personal data has been profiled (as
              permitted by applicable law, including the privacy law in Connecticut and Minnesota)
            </li>
            <li>
              Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including the privacy law in
              California)
            </li>
            <li>
              Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial
              recognition feature (as permitted by applicable law, including the privacy law in Florida)
            </li>
          </ul>

          <h3 className="my-6 text-xl font-semibold">How to Exercise Your Rights</h3>
          <p className="mb-4">
            To exercise these rights, you can contact us by visiting{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            , by emailing us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            , By mailing to 11101 Harrison Ave S, Minneapolis, MN 55437, or by referring to the contact details at the bottom of this
            document.
          </p>
          <p className="mb-4">
            Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny
            a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in
            accordance with applicable laws.
          </p>

          <h3 className="my-6 text-xl font-semibold">Request Verification</h3>
          <p className="mb-4">
            Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the
            information in our system. We will only use personal information provided in your request to verify your identity or authority
            to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request
            that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention
            purposes.
          </p>
          <p className="mb-4">
            If you submit the request through an authorized agent, we may need to collect additional information to verify your identity
            before processing your request and the agent will need to provide a written and signed permission from you to submit such
            request on your behalf.
          </p>

          <h3 className="my-6 text-xl font-semibold">Appeals</h3>
          <p className="mb-4">
            Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by
            emailing us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            . We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of
            the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.
          </p>

          <h3 className="my-6 text-xl font-semibold">California &quot;Shine The Light&quot; Law</h3>
          <p>
            California Civil Code Section 1798.83, also known as the &quot;Shine The Light&quot; law, permits our users who are California
            residents to request and obtain from us, once a year and free of charge, information about categories of personal information
            (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which
            we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to
            make such a request, please submit your request in writing to us by using the contact details provided in the section &quot;
            <a href="#contact" className="text-primary hover:underline">
              HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </a>
            &quot;
          </p>
        </section>

        <section id="policyupdates" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">15. Do We Make Updates To This Notice?</h2>
          <p className="mb-4 italic">
            <strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.
          </p>
          <p>
            We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot;
            date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by
            prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy
            Notice frequently to be informed of how we are protecting your information.
          </p>
        </section>

        <section id="contact" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">16. How Can You Contact Us About This Notice?</h2>
          <p className="mb-4">
            If you have questions or comments about this notice, you may email us at{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>{' '}
            or contact us by post at:
          </p>
          <address className="not-italic">
            <strong>Schelske Dev Co. LLC</strong>
            <br />
            11101 Harrison Ave S<br />
            Minneapolis, MN 55437
            <br />
            United States
          </address>
        </section>

        <section id="request" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold uppercase">17. How Can You Review, Update, Or Delete The Data We Collect From You?</h2>
          <p>
            Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the
            personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal
            information. You may also have the right to withdraw your consent to our processing of your personal information. These rights
            may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information,
            please visit:{' '}
            <a href="mailto:joe@schelske.dev" className="text-primary hover:underline">
              joe@schelske.dev
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
