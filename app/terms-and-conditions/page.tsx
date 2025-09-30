
import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">Terms and Conditions</h1>
          
          <p className="text-slate-600 mb-8">
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-blue-800">
              Welcome to GigSecure, Kenya's premier platform for connecting event organizers with professional talent. 
              By using our services, you agree to these terms and conditions.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">1. Platform Overview</h2>
          <p className="text-slate-700 mb-4">
            GigSecure operates as a digital marketplace platform based in Kenya, facilitating connections between event organizers 
            and professional talent including musicians, DJs, photographers, MCs, speakers, and other event service providers. 
            Our platform uses a secure 4-step booking process with integrated Paystack payment processing.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">2. User Accounts and Roles</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.1 User Categories</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>TALENT:</strong> Professional service providers offering event-related services</li>
            <li><strong>ORGANIZER:</strong> Individuals or entities seeking to book talent for events</li>
            <li><strong>ADMIN:</strong> Platform administrators with oversight and dispute resolution authority</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.2 Account Requirements</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Users must be at least 18 years old or have legal guardian consent</li>
            <li>All information provided must be accurate and current</li>
            <li>Users are responsible for maintaining account security</li>
            <li>One account per person or business entity</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">3. Booking Process and Payments</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.1 4-Step Booking Process</h3>
          <ol className="list-decimal pl-6 text-slate-700 mb-4">
            <li><strong>Discovery:</strong> Organizers browse and find suitable talent</li>
            <li><strong>Communication:</strong> Direct messaging and negotiation of terms</li>
            <li><strong>Booking:</strong> Formal booking request and acceptance</li>
            <li><strong>Payment:</strong> Secure payment processing through Paystack</li>
          </ol>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.2 Payment Terms</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>All payments are processed through Paystack payment gateway</li>
            <li>Payments are held in escrow until service completion</li>
            <li>GigSecure charges a 10% commission on successful bookings</li>
            <li>Commission is reduced to 5% for bookings resolved through our dispute system</li>
            <li>Refunds are subject to our cancellation and dispute policies</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">4. Service Standards and Obligations</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.1 Talent Obligations</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Provide accurate service descriptions and pricing</li>
            <li>Maintain professional standards and punctuality</li>
            <li>Deliver services as agreed in booking terms</li>
            <li>Respond to communications within reasonable timeframes</li>
            <li>Complete KYC verification when required</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.2 Organizer Obligations</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Provide accurate event details and requirements</li>
            <li>Make timely payments as agreed</li>
            <li>Provide suitable working conditions and access</li>
            <li>Communicate changes or issues promptly</li>
            <li>Treat talent with respect and professionalism</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">5. Dispute Resolution</h2>
          <p className="text-slate-700 mb-4">
            GigSecure provides a comprehensive dispute resolution system administered by our team. 
            Disputes may arise from service quality, payment issues, or contract disagreements. 
            Our admin team reviews all disputes and makes final decisions based on evidence provided by both parties.
          </p>
          <p className="text-slate-700 mb-4">
            For detailed information about our dispute process, please refer to our 
            <Link href="/dispute-policy" className="text-blue-600 hover:text-blue-800 underline"> Dispute Resolution Policy</Link> and 
            <Link href="/how-disputes-work" className="text-blue-600 hover:text-blue-800 underline"> How Disputes Work</Link> pages.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">6. Platform Usage Rules</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">6.1 Prohibited Activities</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Circumventing platform fees or payment systems</li>
            <li>Creating fake accounts or impersonating others</li>
            <li>Posting false or misleading information</li>
            <li>Harassment, discrimination, or inappropriate behavior</li>
            <li>Violating intellectual property rights</li>
            <li>Engaging in illegal activities</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">7. Intellectual Property</h2>
          <p className="text-slate-700 mb-4">
            Users retain ownership of their original content but grant GigSecure a license to use, 
            display, and promote such content on the platform. The GigSecure brand, logo, and platform 
            technology remain the exclusive property of GigSecure.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">8. Limitation of Liability</h2>
          <p className="text-slate-700 mb-4">
            GigSecure acts as an intermediary platform and is not directly responsible for the quality 
            of services provided by talent or the conduct of users. Our liability is limited to the 
            extent permitted by Kenyan law, and we provide the platform "as is" without warranties.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">9. Privacy and Data Protection</h2>
          <p className="text-slate-700 mb-4">
            Your privacy is important to us. Please review our 
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline"> Privacy Policy</Link> 
            to understand how we collect, use, and protect your personal information in compliance with 
            Kenyan data protection laws.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">10. Governing Law</h2>
          <p className="text-slate-700 mb-4">
            These terms are governed by the laws of Kenya. Any disputes arising from these terms 
            will be subject to the jurisdiction of Kenyan courts, with Nairobi as the preferred venue.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">11. Changes to Terms</h2>
          <p className="text-slate-700 mb-4">
            GigSecure reserves the right to modify these terms at any time. Users will be notified 
            of significant changes, and continued use of the platform constitutes acceptance of updated terms.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">12. Contact Information</h2>
          <p className="text-slate-700 mb-4">
            For questions about these terms or our services, please contact us through our platform 
            support system or reach out to our customer service team.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
            <p className="text-slate-600 text-sm">
              By using GigSecure, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
