import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Sparkles, FileDown, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-amber-50 to-white py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
            Children's Book Creator
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-stone-800 md:text-6xl">
            Write. Illustrate. Publish.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone-500">
            Create beautiful children's books with AI-powered illustrations and export print-ready files for Amazon KDP — all from your browser.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 bg-amber-700 px-8 text-base hover:bg-amber-800" onClick={() => navigate({ to: '/home' })}>
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-stone-300 px-8 text-base" onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}>
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works — Preview Section */}
      <section id="preview" className="border-b bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-stone-800">From Idea to Published Book in 4 Steps</h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-stone-500">No design experience needed. Our tools handle the technical details so you can focus on your story.</p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BookOpen, title: 'Write Your Story', desc: 'Add pages, arrange your narrative, set text positions. The editor gives you full control over every page.' },
              { icon: Sparkles, title: 'AI Illustrations', desc: 'Describe your scene and our AI creates beautiful, print-quality illustrations matched to your story.' },
              { icon: FileDown, title: 'Export KDP Files', desc: 'One click generates your interior PDF and full-wrap cover — perfectly formatted for Amazon KDP printing.' },
              { icon: CheckCircle, title: 'Publish on Amazon', desc: 'Upload your files to KDP, set your price, and your book is available worldwide. We handle the specs.' },
            ].map((step, i) => (
              <Card key={i} className="border-stone-200 shadow-sm">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <step.icon className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-stone-800">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-stone-500">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="border-b bg-stone-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-stone-800">Built for Real Publishing</h2>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { title: 'Amazon KDP Ready', desc: '8.5x8.5" trim, 0.125" bleed, 300 DPI — every spec handled automatically.' },
              { title: 'AI Illustration Engine', desc: 'Powered by Grok AI. Describe your scene, get a print-quality illustration in seconds.' },
              { title: 'Full-Wrap Cover Builder', desc: 'Front cover, spine, and back cover on one canvas with automatic spine width calculation.' },
              { title: 'Built on Internet Computer', desc: 'Your projects live on-chain. No server to maintain. Your data is yours.' },
              { title: 'Real PDF Export', desc: 'Not a mockup — real jsPDF-generated files you can upload directly to KDP.' },
              { title: 'Professional Validation', desc: 'Automatic preflight checks catch issues before you upload. No rejected manuscripts.' },
            ].map((f, i) => (
              <div key={i} className="rounded-lg border border-stone-200 bg-white p-6">
                <h3 className="mb-2 font-semibold text-stone-800">{f.title}</h3>
                <p className="text-sm leading-relaxed text-stone-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="border-b bg-white py-20">
        <div className="container mx-auto max-w-md px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-stone-800">Simple Pricing</h2>
          <p className="mb-8 text-stone-500">Try free. Subscribe when you're ready to export.</p>

          <Card className="border-2 border-amber-200 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <p className="text-sm font-medium uppercase tracking-wide text-amber-700">Creator Plan</p>
              <p className="mt-2 text-5xl font-bold text-stone-800">$9.99<span className="text-lg font-normal text-stone-400">/mo</span></p>
              <ul className="mt-6 space-y-3 text-left text-sm">
                {[
                  'Unlimited book projects',
                  'AI-powered illustrations',
                  'KDP-ready PDF export',
                  'Full-wrap cover builder',
                  'Cancel anytime',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-600">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full bg-amber-700 text-base hover:bg-amber-800" size="lg" onClick={() => navigate({ to: '/subscribe' })}>
                Subscribe Now
              </Button>
              <p className="mt-3 text-xs text-stone-400">Secure checkout via Stripe</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white">Ready to bring your story to life?</h2>
          <p className="mt-3 text-stone-400">Start building your book today — no credit card required to explore.</p>
          <Button size="lg" className="mt-8 gap-2 bg-amber-600 px-8 text-base hover:bg-amber-700" onClick={() => navigate({ to: '/home' })}>
            <BookOpen className="h-4 w-4" />
            Start Your Book
          </Button>
        </div>
      </section>
    </div>
  );
}
