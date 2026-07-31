import { Link } from '@tanstack/react-router';

export function LegalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-300">
      <div className="mx-auto max-w-2xl">
        <Link to="/login" className="text-sm text-brand hover:underline">
          ← Back to MatuSMS
        </Link>
        <h1 className="mb-6 mt-8 text-3xl font-bold text-white">MatuSMS — Legal</h1>

        <section className="mb-8 space-y-3">
          <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
          <p>
            MatuSMS is an SMS gateway platform operated as part of the MatuDB ecosystem. By using
            MatuSMS you agree to comply with applicable telecommunications laws and obtain consent
            before sending SMS messages to recipients.
          </p>
          <p>
            You are responsible for all messages sent through your registered phones and API keys.
            MatuSMS is provided &quot;as is&quot; without warranty.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
          <p>
            Message content, phone numbers, and account data are stored in your MatuDB project.
            We do not sell your data. Firebase Authentication is used for dashboard login; FCM is
            used to notify the MatuSMS Android app of pending messages.
          </p>
          <p>
            Optional end-to-end encryption keys are stored only on your devices (browser local
            storage / Android secure storage) and are never sent to our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>
            Support:{' '}
            <a href="mailto:support@matusms.com" className="text-brand">
              support@matusms.com
            </a>
          </p>
          <p>
            System:{' '}
            <a href="mailto:system@matusms.com" className="text-brand">
              system@matusms.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
