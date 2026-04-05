import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/mobile/AppHeader";

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[768px] mx-auto min-h-screen bg-white">
      <AppHeader variant="back-title" title="Privacy Policy" onBack={() => navigate(-1)} />
      <div className="px-5 py-6 prose prose-sm prose-gray max-w-none [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-[13px] [&_p]:leading-[20px] [&_p]:text-gray-600 [&_p]:mb-3 [&_li]:text-[13px] [&_li]:leading-[20px] [&_li]:text-gray-600 [&_ul]:mb-3 [&_ol]:mb-3">
        <p className="!text-[11px] !text-gray-400 !mb-6">Last updated: April 5, 2026</p>

        <h2>1. Introduction</h2>
        <p>ProBook Technologies ("we", "us", "our") operates the ProBook platform at probooking.app. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our services.</p>
        <p>We are committed to protecting your privacy and processing your data in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR) where applicable.</p>

        <h2>2. Information We Collect</h2>

        <h3>2.1 Account Information</h3>
        <p>When you create an account, we collect:</p>
        <ul className="list-disc pl-5">
          <li><strong>Email address</strong> — for login, communications, and account recovery</li>
          <li><strong>Phone number</strong> — for login, SMS notifications, and booking identification</li>
          <li><strong>Name</strong> — for display and booking identification</li>
          <li><strong>Password</strong> — stored securely using bcrypt hashing (we never store or see your plain-text password)</li>
          <li><strong>Role selection</strong> — client, professional, or business owner</li>
        </ul>

        <h3>2.2 Guest Booking Information</h3>
        <p>You can book appointments without creating an account. We collect:</p>
        <ul className="list-disc pl-5">
          <li>Name and phone number (required)</li>
          <li>Email address (optional)</li>
          <li>Booking notes (optional)</li>
        </ul>
        <p>Your phone number serves as your identifier for booking management and is stored across the platform to link your bookings.</p>

        <h3>2.3 Professional Profile Data</h3>
        <p>Professionals may provide: biography, years of experience, nationality, social media links (e.g. Instagram), portfolio photos, and avatar image.</p>

        <h3>2.4 Business Information</h3>
        <p>Business owners provide: business name, address, phone, email, description, logo, geographic coordinates (latitude/longitude), and service pricing.</p>

        <h3>2.5 Booking & Session Data</h3>
        <p>For each appointment we store: selected service, professional, date/time, duration, price, payment status, and any cancellation reasons.</p>

        <h3>2.6 Payment Information</h3>
        <p>Payments are processed by <strong>Stripe</strong>. We do not store your credit card number, CVV, or full card details on our servers. We store only: transaction reference IDs, amounts, payment status, and receipt URLs provided by Stripe.</p>

        <h3>2.7 Reviews</h3>
        <p>When you leave a review, we collect: your name, phone number, rating (1–5), text comment, and up to 3 images. Reviews are publicly visible by default.</p>

        <h3>2.8 Professional Notes About Clients</h3>
        <p>Professionals may create private notes and photos about clients for service continuity (e.g., preferred nail styles, allergies). These are visible only to the professional who created them and their business owner.</p>

        <h3>2.9 Uploaded Files</h3>
        <p>Photos and images you upload (avatars, portfolios, review images) are stored on Amazon Web Services (AWS) S3 cloud storage in the EU (eu-central-1 region).</p>

        <h3>2.10 Technical & Device Data</h3>
        <ul className="list-disc pl-5">
          <li><strong>Browser push subscription</strong> — endpoint URL and encryption keys for Web Push notifications</li>
          <li><strong>Telegram chat ID</strong> — if you link your Telegram account</li>
          <li><strong>Authentication tokens</strong> — JWT access tokens and refresh tokens stored in your browser's localStorage</li>
          <li><strong>Language preference</strong> — stored in localStorage</li>
          <li><strong>Theme preference</strong> — light/dark mode stored in localStorage</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul className="list-disc pl-5">
          <li><strong>Provide services</strong> — process bookings, manage appointments, enable payments</li>
          <li><strong>Communications</strong> — send booking confirmations, reminders, and cancellation notices via SMS, email, Telegram, or browser push</li>
          <li><strong>Scheduled alerts</strong> — daily booking briefs, weekly schedules, end-of-day recaps, appointment reminders (configurable per user)</li>
          <li><strong>Account management</strong> — authenticate you, manage your profile and preferences</li>
          <li><strong>Service improvement</strong> — understand usage patterns and improve the platform</li>
          <li><strong>Business operations</strong> — provide analytics, reporting, and revenue tracking to professionals and business owners</li>
          <li><strong>Legal compliance</strong> — fulfill legal obligations and resolve disputes</li>
        </ul>

        <h2>4. Third-Party Services</h2>
        <p>We share data with the following third-party services, each with their own privacy policies:</p>

        <table className="w-full text-[12px] border-collapse mb-4">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-3 font-semibold text-gray-700">Service</th>
              <th className="text-left py-2 pr-3 font-semibold text-gray-700">Purpose</th>
              <th className="text-left py-2 font-semibold text-gray-700">Data Shared</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-3 font-medium">Stripe</td>
              <td className="py-2 pr-3">Payment processing</td>
              <td className="py-2">Booking amount, email, name</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-3 font-medium">Twilio</td>
              <td className="py-2 pr-3">SMS notifications</td>
              <td className="py-2">Phone number, message text</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-3 font-medium">Google Maps</td>
              <td className="py-2 pr-3">Address autocomplete & maps</td>
              <td className="py-2">Address search queries, coordinates</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-3 font-medium">Telegram</td>
              <td className="py-2 pr-3">Push notifications</td>
              <td className="py-2">Chat ID, notification text</td>
            </tr>
            <tr>
              <td className="py-2 pr-3 font-medium">AWS S3</td>
              <td className="py-2 pr-3">Image storage</td>
              <td className="py-2">Uploaded photos and files</td>
            </tr>
          </tbody>
        </table>

        <h2>5. Cookies & Local Storage</h2>
        <h3>5.1 Essential (Always Active)</h3>
        <p>Authentication tokens, session data, and security-related storage. Required for the Platform to function.</p>

        <h3>5.2 Functional</h3>
        <p>Language preference, theme selection (light/dark), saved booking details for guest users. These improve your experience across visits.</p>

        <h3>5.3 Analytics</h3>
        <p>Usage data to help us understand how the Platform is used and improve it. No personal data is shared with third-party analytics services.</p>
        <p>You can manage cookie preferences via the consent banner shown on your first visit.</p>

        <h2>6. Data Security</h2>
        <ul className="list-disc pl-5">
          <li>Passwords are hashed using bcrypt and never stored in plain text</li>
          <li>Authentication uses signed JWT tokens with configurable expiration</li>
          <li>Refresh tokens are stored in the database and rotated on each use</li>
          <li>Telegram account linking uses HMAC-SHA256 signed deep links to prevent spoofing</li>
          <li>Payment data is handled exclusively by Stripe (PCI-DSS Level 1 compliant)</li>
          <li>Web Push notifications use VAPID encryption</li>
          <li>All data in transit is encrypted via HTTPS/TLS</li>
          <li>Multi-tenant data isolation ensures each business can only access its own data</li>
        </ul>

        <h2>7. Data Retention</h2>
        <ul className="list-disc pl-5">
          <li><strong>Access tokens</strong> — expire after 60 minutes</li>
          <li><strong>Refresh tokens</strong> — expire after 30 days and are revoked on rotation</li>
          <li><strong>Account data</strong> — retained while your account is active; deleted upon account deletion request</li>
          <li><strong>Booking data</strong> — retained for record-keeping and dispute resolution</li>
          <li><strong>Push subscriptions</strong> — automatically removed when they become invalid</li>
          <li><strong>Notification logs</strong> — retained for audit and troubleshooting purposes</li>
        </ul>

        <h2>8. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul className="list-disc pl-5">
          <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
          <li><strong>Rectification</strong> — correct inaccurate personal data</li>
          <li><strong>Erasure</strong> — request deletion of your personal data ("right to be forgotten")</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
          <li><strong>Restriction</strong> — limit how we process your data</li>
          <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
          <li><strong>Withdraw consent</strong> — for optional processing like notifications and analytics</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:privacy@probooking.app" className="text-gray-900 underline">privacy@probooking.app</a>.</p>

        <h2>9. Children's Privacy</h2>
        <p>The Platform is not intended for use by individuals under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us.</p>

        <h2>10. International Data Transfers</h2>
        <p>Your data may be processed in countries outside your jurisdiction, including the United States (AWS, Stripe, Twilio) and the European Union (AWS S3 storage). We ensure appropriate safeguards are in place for such transfers.</p>

        <h2>11. Changes to This Policy</h2>
        <p>We may update this Privacy Policy periodically. We will notify registered users of material changes via email or in-app notification. Continued use of the Platform after changes constitutes acceptance.</p>

        <h2>12. Contact Us</h2>
        <p>For privacy-related questions or concerns:</p>
        <ul className="list-disc pl-5">
          <li>Email: <a href="mailto:privacy@probooking.app" className="text-gray-900 underline">privacy@probooking.app</a></li>
          <li>Website: <a href="https://probooking.app" className="text-gray-900 underline">probooking.app</a></li>
        </ul>
      </div>
    </div>
  );
}
