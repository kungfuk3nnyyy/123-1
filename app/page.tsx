import { PublicHeader } from '@/components/public-header'
import { SearchSection } from '@/components/home/SearchSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8">
        <section className="py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find & Book Top Talent for Your Event
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with the best photographers, MCs, DJs, and more for your next event.
          </p>
        </section>
        <SearchSection />
      </main>
    </div>
  )
}
