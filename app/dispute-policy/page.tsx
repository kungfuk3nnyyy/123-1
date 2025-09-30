
import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'

export default function DisputePolicy() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">Dispute Resolution Policy</h1>
          
          <p className="text-slate-600 mb-8">
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8">
            <p className="text-amber-800">
              GigSecure is committed to fair and efficient dispute resolution. This policy outlines our formal 
              procedures for handling conflicts between organizers and talent, ensuring equitable outcomes for all parties.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">1. Overview of Dispute Resolution</h2>
          <p className="text-slate-700 mb-4">
            Our dispute resolution system is designed to address conflicts that may arise during the booking process, 
            service delivery, or payment phases. All disputes are reviewed by our experienced admin team, 
            who have the authority to make final binding decisions based on evidence and platform policies.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">2. Types of Disputes</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.1 Service Quality Disputes</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Talent failed to meet agreed service standards</li>
            <li>Services not delivered as described in booking</li>
            <li>Professional conduct issues</li>
            <li>Equipment or technical failures affecting service delivery</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.2 Payment Disputes</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Non-payment or delayed payment by organizers</li>
            <li>Disputed charges or commission calculations</li>
            <li>Refund requests for cancelled or unsatisfactory services</li>
            <li>Payment processing errors through Paystack</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">2.3 Contract and Communication Disputes</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Disagreements over booking terms and conditions</li>
            <li>Miscommunication about event requirements</li>
            <li>Changes to agreed terms without mutual consent</li>
            <li>Cancellation disputes and associated fees</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">3. Dispute Initiation Process</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.1 Eligibility Requirements</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Dispute must be related to a booking made through GigSecure platform</li>
            <li>Initial attempt at direct resolution between parties is encouraged</li>
            <li>Dispute must be filed within 14 days of the event or issue occurrence</li>
            <li>All relevant documentation and evidence must be provided</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">3.2 Filing a Dispute</h3>
          <ol className="list-decimal pl-6 text-slate-700 mb-4">
            <li><strong>Access Dispute System:</strong> Log into your GigSecure account and navigate to the dispute section</li>
            <li><strong>Select Booking:</strong> Choose the specific booking related to your dispute</li>
            <li><strong>Dispute Category:</strong> Select the appropriate dispute type from our categories</li>
            <li><strong>Detailed Description:</strong> Provide a comprehensive explanation of the issue</li>
            <li><strong>Evidence Upload:</strong> Submit supporting documents, photos, videos, or communications</li>
            <li><strong>Submit Request:</strong> Review and submit your dispute for admin review</li>
          </ol>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">4. Admin Review Process</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.1 Initial Assessment</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>24-48 Hours:</strong> Admin team acknowledges dispute receipt</li>
            <li><strong>Eligibility Check:</strong> Verification that dispute meets filing requirements</li>
            <li><strong>Evidence Review:</strong> Initial assessment of submitted documentation</li>
            <li><strong>Notification:</strong> Both parties notified of dispute initiation</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.2 Investigation Phase</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Evidence Collection:</strong> Request additional information from both parties</li>
            <li><strong>Communication Review:</strong> Analysis of platform messages and booking details</li>
            <li><strong>Policy Application:</strong> Evaluation against GigSecure terms and conditions</li>
            <li><strong>Precedent Consideration:</strong> Review of similar past disputes and resolutions</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">4.3 Decision Timeline</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Simple Disputes:</strong> 3-5 business days</li>
            <li><strong>Complex Disputes:</strong> 7-10 business days</li>
            <li><strong>Exceptional Cases:</strong> Up to 14 business days with notification</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">5. Resolution Outcomes</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">5.1 Possible Resolutions</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li><strong>Full Refund:</strong> Complete return of payment to organizer</li>
            <li><strong>Partial Refund:</strong> Proportional refund based on service delivery</li>
            <li><strong>Payment Release:</strong> Authorization of payment to talent</li>
            <li><strong>Service Credit:</strong> Platform credit for future bookings</li>
            <li><strong>Mediated Settlement:</strong> Negotiated agreement between parties</li>
            <li><strong>No Action:</strong> Dispute dismissed if unfounded</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">5.2 Commission Adjustment</h3>
          <p className="text-slate-700 mb-4">
            For bookings resolved through our dispute system, GigSecure reduces its commission from the standard 10% to 5%, 
            recognizing the additional complexity and administrative effort required for resolution.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">6. Appeals Process</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">6.1 Appeal Eligibility</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Appeals must be filed within 7 days of dispute resolution</li>
            <li>New evidence or significant procedural errors must be demonstrated</li>
            <li>Appeals are limited to one per dispute</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">6.2 Appeal Review</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Senior admin team reviews appeal and original decision</li>
            <li>Additional evidence may be requested</li>
            <li>Appeal decisions are final and binding</li>
            <li>Resolution timeline: 5-7 business days</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">7. Escalation to External Mediation</h2>
          <p className="text-slate-700 mb-4">
            In exceptional circumstances involving high-value disputes or complex legal issues, 
            parties may agree to external mediation through recognized Kenyan mediation services. 
            Costs for external mediation are typically shared between parties.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">8. Dispute Prevention</h2>
          
          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">8.1 Best Practices for Organizers</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Clearly communicate event requirements and expectations</li>
            <li>Review talent profiles and ratings thoroughly</li>
            <li>Confirm all details before finalizing bookings</li>
            <li>Maintain professional communication throughout</li>
          </ul>

          <h3 className="text-xl font-medium text-slate-800 mt-6 mb-3">8.2 Best Practices for Talent</h3>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Provide accurate service descriptions and capabilities</li>
            <li>Confirm event details and requirements before accepting</li>
            <li>Communicate any issues or changes promptly</li>
            <li>Maintain professional standards and punctuality</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">9. Record Keeping and Privacy</h2>
          <p className="text-slate-700 mb-4">
            All dispute records are maintained confidentially and used only for resolution purposes. 
            Records are retained for 2 years after resolution for reference and platform improvement. 
            Personal information is handled in accordance with our 
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">10. Policy Updates</h2>
          <p className="text-slate-700 mb-4">
            This dispute policy may be updated to improve our resolution process or comply with legal requirements. 
            Users will be notified of significant changes, and the updated policy will apply to disputes filed after the effective date.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Need Help?</h3>
            <p className="text-slate-600 text-sm mb-2">
              For a user-friendly guide to our dispute process, visit our 
              <Link href="/how-disputes-work" className="text-blue-600 hover:text-blue-800 underline"> How Disputes Work</Link> page.
            </p>
            <p className="text-slate-600 text-sm">
              If you have questions about this policy or need assistance with a dispute, 
              contact our support team through your GigSecure account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
