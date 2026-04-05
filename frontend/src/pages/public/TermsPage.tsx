import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/mobile/AppHeader";

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[768px] mx-auto min-h-screen bg-white">
      <AppHeader variant="back-title" title="Terms of Service" onBack={() => navigate(-1)} />
      <div className="px-5 py-6 prose prose-sm prose-gray max-w-none [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-[13px] [&_p]:leading-[20px] [&_p]:text-gray-600 [&_p]:mb-3 [&_li]:text-[13px] [&_li]:leading-[20px] [&_li]:text-gray-600 [&_ul]:mb-3 [&_ol]:mb-3">
        <p className="!text-[11px] !text-gray-400 !mb-6">Last updated: April 5, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using ProBook ("the Platform"), operated by ProBook Technologies ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>

        <h2>2. Description of Service</h2>
        <p>ProBook is a multi-tenant SaaS platform that connects clients with beauty and wellness professionals. The Platform provides:</p>
        <ul className="list-disc pl-5">
          <li>Online booking of appointments with service providers</li>
          <li>Business management tools for salon owners and independent professionals</li>
          <li>Calendar, scheduling, and client management</li>
          <li>Payment processing via third-party providers</li>
          <li>Notification services (SMS, email, Telegram, browser push)</li>
          <li>Review and rating system</li>
        </ul>

        <h2>3. User Accounts & Roles</h2>
        <h3>3.1 Account Types</h3>
        <p>The Platform supports four user roles:</p>
        <ul className="list-disc pl-5">
          <li><strong>Client</strong> — books appointments and leaves reviews</li>
          <li><strong>Professional</strong> — provides services, manages schedule</li>
          <li><strong>Provider Owner</strong> — manages a business, its professionals, and services</li>
          <li><strong>Platform Admin</strong> — administers the entire platform</li>
        </ul>

        <h3>3.2 Guest Booking</h3>
        <p>Clients may book appointments without creating an account by providing their name and phone number. A confirmation code is issued for managing the booking.</p>

        <h3>3.3 Account Responsibility</h3>
        <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorized use of your account.</p>

        <h2>4. Booking & Cancellation</h2>
        <p>Bookings are subject to availability. Confirmation codes are provided for guest bookings. Cancellation policies are set by individual service providers. The Platform facilitates but does not guarantee appointment availability.</p>

        <h2>5. Payments</h2>
        <p>Payment processing is handled by Stripe, a PCI-DSS compliant third-party payment processor. We do not store your credit card information on our servers. By making a payment, you also agree to Stripe's <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">Terms of Service</a>.</p>
        <p>Deposits and full payments are processed as configured by each service provider. Refund policies are determined by the individual provider.</p>

        <h2>6. User Content</h2>
        <h3>6.1 Reviews</h3>
        <p>Clients may submit reviews including ratings, text comments, and up to 3 images. Reviews are public by default. Provider owners may moderate review visibility. You grant us a non-exclusive license to display your reviews on the Platform.</p>

        <h3>6.2 Uploaded Content</h3>
        <p>Professionals and providers may upload portfolio photos, avatars, and logos. You retain ownership of your content but grant us a license to store, display, and distribute it within the Platform. Content must not violate any laws or third-party rights.</p>

        <h3>6.3 Professional Notes</h3>
        <p>Professionals may create private notes and photos about clients for service continuity. These are visible only to the creating professional and their provider owner.</p>

        <h2>7. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5">
          <li>Use the Platform for any unlawful purpose</li>
          <li>Provide false or misleading information</li>
          <li>Attempt to gain unauthorized access to other users' accounts</li>
          <li>Upload malicious content or attempt to disrupt the service</li>
          <li>Scrape, harvest, or collect user data without authorization</li>
          <li>Impersonate another person or entity</li>
        </ul>

        <h2>8. Intellectual Property</h2>
        <p>The Platform, its design, features, and content (excluding user-generated content) are owned by ProBook Technologies. You may not copy, modify, or distribute any part of the Platform without our written consent.</p>

        <h2>9. Third-Party Services</h2>
        <p>The Platform integrates with third-party services. Your use of these services is subject to their respective terms:</p>
        <ul className="list-disc pl-5">
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>Twilio</strong> — SMS notifications</li>
          <li><strong>Google Maps</strong> — location and address services</li>
          <li><strong>Telegram</strong> — messaging notifications</li>
          <li><strong>Amazon Web Services</strong> — file storage</li>
        </ul>

        <h2>10. Limitation of Liability</h2>
        <p>The Platform is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. We do not guarantee uninterrupted or error-free service.</p>
        <p>We are not a party to transactions between clients and service providers. Disputes regarding services rendered should be resolved directly between the parties.</p>

        <h2>11. Termination</h2>
        <p>We may suspend or terminate your account at our discretion for violation of these Terms. You may delete your account at any time by contacting support. Upon termination, your right to use the Platform ceases immediately.</p>

        <h2>12. Changes to Terms</h2>
        <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance. We will notify registered users of material changes via email or in-app notification.</p>

        <h2>13. Governing Law</h2>
        <p>These Terms are governed by the laws of the jurisdiction in which ProBook Technologies is registered. Any disputes shall be resolved in the competent courts of that jurisdiction.</p>

        <h2>14. Contact</h2>
        <p>For questions about these Terms, contact us at <a href="mailto:legal@probooking.app" className="text-gray-900 underline">legal@probooking.app</a>.</p>
      </div>
    </div>
  );
}
