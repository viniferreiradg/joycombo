import TestimonialsCarousel from '@/components/sections/TestimonialsCarousel'
import type { TestimonialDoc } from '@/lib/data'

export default function Testimonials({ kicker, title, items }: { kicker: string; title: string; items: TestimonialDoc[] }) {
  if (!items.length) return null

  return (
    <section id="depoimentos" aria-label={title} className="on-dark bg-black text-white">
      <TestimonialsCarousel kicker={kicker} title={title} items={items} />
    </section>
  )
}
