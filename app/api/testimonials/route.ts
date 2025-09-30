
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/testimonials - Get testimonials for homepage
export async function GET() {
  try {
    // Static testimonials data with the generated CDN images
    const testimonials = [
      {
        id: 1,
        name: "Grace Wanjiku",
        title: "Event Organizer",
        company: "Nairobi Corporate Events",
        content: "Finding qualified talent has never been easier. The platform's verification system gave me confidence, and the results exceeded expectations. Our company event was flawless.",
        image: "https://cdn.abacus.ai/images/18de9e8f-f60c-4f8b-8539-340989c08b7c.png",
        rating: 5
      },
      {
        id: 2,
        name: "David Kimani",
        title: "Corporate Event Planner",
        company: "Summit Events Kenya",
        content: "The seamless booking process and secure payment system made organizing our annual conference stress-free. Every talent delivered exceptional quality.",
        image: "https://cdn.abacus.ai/images/8a269924-69a6-4a89-aad4-9a46cef5a9fe.png",
        rating: 5
      },
      {
        id: 3,
        name: "Sarah Njeri",
        title: "Wedding Planner",
        company: "Dream Weddings Kenya",
        content: "This platform transformed how I source talent for weddings. The quality is consistently high, and my clients are always impressed with the professionals we find here.",
        image: "https://cdn.abacus.ai/images/2f3e80b1-463c-4344-a985-94e58315906f.png",
        rating: 5
      }
    ]

    return NextResponse.json({
      success: true,
      testimonials,
      totalCount: testimonials.length
    })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
