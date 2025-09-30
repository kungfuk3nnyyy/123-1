
import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">Privacy Policy</h1>
          
          <p className="text-slate-600 mb-8">
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
            <p className="text-green-800">
              At GigSecure, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This policy explains how we collect, use, and safeguard your data in compliance with Kenyan data protection laws.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">1.1 Personal Information</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Account Information:</strong> Name, email address, phone number, location</li>
            <li><strong>Profile Information:</strong> Professional skills, experience, portfolio items, photos</li>
            <li><strong>Identity Verification:</strong> Government ID, business registration documents (for KYC)</li>
            <li><strong>Payment Information:</strong> Bank account details, M-Pesa numbers (processed securely through Paystack)</li>
            <li><strong>Communication Data:</strong> Messages, reviews, ratings, and feedback</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">1.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
            <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
            <li><strong>Location Data:</strong> General location for service matching (with your consent)</li>
            <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">2. How We Use Your Information</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.1 Platform Operations</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Creating and managing user accounts</li>
            <li>Facilitating connections between organizers and talent</li>
            <li>Processing bookings through our 4-step booking system</li>
            <li>Handling payments and commission calculations (10% standard, 5% for disputed resolutions)</li>
            <li>Providing customer support and resolving disputes</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.2 Communication and Marketing</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Sending booking confirmations and updates</li>
            <li>Notifying users of platform updates and new features</li>
            <li>Marketing communications (with your consent)</li>
            <li>SMS notifications for important account activities</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.3 Safety and Security</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Verifying user identities and preventing fraud</li>
            <li>Monitoring for suspicious activities</li>
            <li>Enforcing our terms of service</li>
            <li>Protecting against security threats</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">3. Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.1 With Other Users</h3>
          <p className="text-slate-700 mb-4">
            We share necessary information to facilitate bookings, including contact details, 
            service information, and reviews. Users control what information appears in their public profiles.
          </p>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.2 With Service Providers</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Paystack:</strong> Payment processing and transaction data</li>
            <li><strong>Cloud Services:</strong> Data storage and platform hosting</li>
            <li><strong>Analytics Providers:</strong> Platform usage and performance data</li>
            <li><strong>Communication Services:</strong> Email and SMS delivery</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.3 Legal Requirements</h3>
          <p className="text-slate-700 mb-4">
            We may disclose information when required by Kenyan law, court orders, or to protect 
            the rights, property, or safety of GigSecure, our users, or the public.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">4. Data Security</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.1 Security Measures</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Secure payment processing through PCI-compliant Paystack</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication systems</li>
            <li>Employee training on data protection practices</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.2 Data Breach Response</h3>
          <p className="text-slate-700 mb-4">
            In the event of a data breach, we will notify affected users and relevant authorities 
            within 72 hours as required by Kenyan data protection regulations.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">5. Your Rights and Choices</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">5.1 Access and Control</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Access:</strong> Request copies of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Export your data in a structured format</li>
            <li><strong>Restriction:</strong> Limit how we process your information</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">5.2 Communication Preferences</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Opt out of marketing communications</li>
            <li>Choose notification preferences</li>
            <li>Control profile visibility settings</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">6. Data Retention</h2>
          <p className="text-slate-700 mb-4">
            We retain your information for as long as necessary to provide our services and comply with legal obligations:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Active Accounts:</strong> Data retained while account is active</li>
            <li><strong>Closed Accounts:</strong> Most data deleted within 30 days</li>
            <li><strong>Financial Records:</strong> Retained for 7 years for tax and audit purposes</li>
            <li><strong>Dispute Records:</strong> Retained for 2 years after resolution</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">7. International Data Transfers</h2>
          <p className="text-slate-700 mb-4">
            While GigSecure operates primarily in Kenya, some of our service providers may process 
            data internationally. We ensure appropriate safeguards are in place for any international transfers.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">8. Children's Privacy</h2>
          <p className="text-slate-700 mb-4">
            GigSecure is not intended for users under 18 years of age. We do not knowingly collect 
            personal information from children. If we become aware of such collection, we will delete the information promptly.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">9. Cookies and Tracking Technologies</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">9.1 Types of Cookies</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
            <li><strong>Analytics Cookies:</strong> Help us understand platform usage</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
          </ul>

          <h2 className="text-2xl font-semibred text-slate-800 mt-8 mb-4">10. Updates to This Policy</h2>
          <p className="text-slate-700 mb-4">
            We may update this privacy policy to reflect changes in our practices or legal requirements. 
            We will notify users of significant changes and post the updated policy on our platform.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">11. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about this privacy policy or wish to exercise your rights, 
            please contact our Data Protection Officer through our platform support system.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Your Consent</h3>
            <p className="text-slate-600 text-sm">
              By using GigSecure, you consent to the collection and use of your information as described in this Privacy Policy. 
              You may withdraw your consent at any time by contacting us or deleting your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
