
import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { Clock, FileText, Search, MessageSquare, CheckCircle, AlertTriangle, Users, Shield } from 'lucide-react'

export default function HowDisputesWork() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">How Disputes Work</h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-blue-800 text-lg">
              Sometimes things don't go as planned. When that happens, GigSecure is here to help resolve any issues 
              fairly and quickly. Here's a simple guide to how our dispute process works.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">When Should You File a Dispute?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Common Issues
              </h3>
              <ul className="text-red-700 space-y-2 text-sm">
                <li>• Talent didn't show up to your event</li>
                <li>• Service quality was much lower than expected</li>
                <li>• Talent cancelled last minute without good reason</li>
                <li>• Payment issues or unexpected charges</li>
                <li>• Equipment problems that ruined your event</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Try This First
              </h3>
              <ul className="text-green-700 space-y-2 text-sm">
                <li>• Send a message to discuss the issue</li>
                <li>• Give the other person a chance to explain</li>
                <li>• See if you can work it out together</li>
                <li>• Keep records of your conversations</li>
                <li>• If no resolution, then file a dispute</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Step-by-Step Dispute Process</h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  File Your Dispute
                </h3>
                <p className="text-slate-700 mb-3">
                  Go to your booking and click "File Dispute." Tell us what went wrong in simple terms. 
                  The more details you provide, the better we can help you.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <p className="text-sm text-slate-600">
                    <strong>What to include:</strong> Photos, screenshots of messages, receipts, 
                    or any other proof that shows what happened.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-amber-600" />
                  We Notify Everyone
                </h3>
                <p className="text-slate-700 mb-3">
                  Within 24-48 hours, we'll let both you and the other person know about the dispute. 
                  They'll have a chance to share their side of the story too.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <p className="text-sm text-slate-600">
                    <strong>During this time:</strong> Your payment is safely held while we investigate. 
                    No money changes hands until we resolve the issue.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Our Team Investigates
                </h3>
                <p className="text-slate-700 mb-3">
                  Our experienced admin team carefully reviews all the evidence from both sides. 
                  We look at messages, booking details, photos, and any other relevant information.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <p className="text-sm text-slate-600">
                    <strong>Investigation time:</strong> Most disputes are resolved in 3-5 business days. 
                    Complex cases may take up to 10 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  We Make a Fair Decision
                </h3>
                <p className="text-slate-700 mb-3">
                  Based on all the evidence, we'll make a decision that's fair to everyone. 
                  You'll receive a detailed explanation of our decision and what happens next.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <p className="text-sm text-slate-600">
                    <strong>Possible outcomes:</strong> Full refund, partial refund, payment to talent, 
                    or platform credit depending on the situation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-12 mb-4">What Happens to Fees?</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Good News About Commission</h3>
            <p className="text-yellow-700 mb-2">
              When a booking goes through our dispute process, we reduce our commission from <strong>10% to just 5%</strong>. 
              This helps offset some of the inconvenience you've experienced.
            </p>
            <p className="text-yellow-700 text-sm">
              This applies whether you're the organizer or the talent - we believe in sharing the cost of resolving disputes fairly.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Important Things to Remember</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-800">Time Limits</h4>
                  <p className="text-slate-600 text-sm">You have 14 days after your event to file a dispute</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-800">Your Money is Safe</h4>
                  <p className="text-slate-600 text-sm">Payments are held securely until disputes are resolved</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-800">Fair Process</h4>
                  <p className="text-slate-600 text-sm">Both sides get to share their story and provide evidence</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-800">Stay Informed</h4>
                  <p className="text-slate-600 text-sm">We'll keep you updated throughout the entire process</p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">What If You Disagree with Our Decision?</h2>
          <p className="text-slate-700 mb-4">
            If you believe our decision was wrong or you have new evidence, you can file an appeal within 7 days. 
            Appeals are reviewed by our senior team and decisions are final.
          </p>

          <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Tips to Avoid Disputes</h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-4">For Event Organizers</h3>
            <ul className="text-green-700 space-y-2">
              <li>• Be clear about your event requirements from the start</li>
              <li>• Check talent reviews and ratings before booking</li>
              <li>• Confirm all details 24-48 hours before your event</li>
              <li>• Keep communication friendly and professional</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">For Talent</h3>
            <ul className="text-blue-700 space-y-2">
              <li>• Only accept bookings you can definitely fulfill</li>
              <li>• Ask questions if event requirements are unclear</li>
              <li>• Communicate immediately if problems arise</li>
              <li>• Always arrive on time and prepared</li>
            </ul>
          </div>

          <div className="bg-slate-100 border border-slate-300 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Need More Details?</h3>
            <p className="text-slate-600 mb-4">
              This guide covers the basics of how disputes work. For complete legal details and procedures, 
              check out our formal <Link href="/dispute-policy" className="text-blue-600 hover:text-blue-800 underline">Dispute Resolution Policy</Link>.
            </p>
            <p className="text-slate-600 text-sm">
              Have questions? Contact our support team through your GigSecure account - we're here to help!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
