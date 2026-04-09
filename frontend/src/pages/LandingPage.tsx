import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Sparkles, FileDown, CheckCircle, ArrowRight, Star, Heart, Palette, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-boho-hero py-24 md:py-32">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-terracotta-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-32 h-56 w-56 rounded-full bg-sage-100/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-blush-100/40 blur-3xl" />

        <div className="container relative mx-auto px-4 text-center">
          {/* Cute emoji accent */}
          <div className="mb-6 flex items-center justify-center gap-2 fade-in">
            <span className="text-2xl">&#x1F33F;</span>
            <span className="rounded-full bg-sage-100 px-4 py-1.5 text-sm font-semibold tracking-wide text-sage-700">
              Children's Book Creator
            </span>
            <span className="text-2xl">&#x1F33F;</span>
          </div>

          <h1 className="fade-in mx-auto max-w-3xl font-display text-5xl font-bold leading-tight text-cream-900 md:text-7xl">
            Create Magical
            <span className="block bg-gradient-to-r from-terracotta-500 via-blush-400 to-terracotta-600 bg-clip-text text-transparent">
              Children's Books
            </span>
          </h1>

          <p className="fade-in mx-auto mt-4 max-w-md font-whimsy text-2xl text-terracotta-400 md:text-3xl">
            Make your child the hero of their own story
          </p>
          <p className="fade-in mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream-700">
            Write your story, add beautiful AI illustrations, and publish a real book on Amazon KDP — all from your browser. It's that simple.
          </p>

          <div className="fade-in-up mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="gap-2 rounded-full bg-terracotta-500 px-8 text-base font-bold shadow-boho hover:bg-terracotta-600 hover:shadow-boho-lg"
              onClick={() => navigate({ to: '/home' })}
            >
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-full border-2 border-cream-400 px-8 text-base font-semibold text-cream-800 hover:bg-cream-100"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works
            </Button>
          </div>

          {/* Trust line */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-cream-600 fade-in">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-sage-500" />
              Secure & Private
            </span>
            <span className="h-4 w-px bg-cream-300" />
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-terracotta-400" />
              AI-Powered
            </span>
            <span className="h-4 w-px bg-cream-300" />
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-sage-500" />
              Publish Worldwide
            </span>
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────── */}
      <div className="boho-divider container mx-auto max-w-md px-4">
        <span className="boho-divider-icon">&#10047;</span>
      </div>

      {/* ── How It Works ──────────────────────────────── */}
      <section id="how-it-works" className="bg-boho-warm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <span className="text-3xl">&#x1F4D6;</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-cream-900 md:text-4xl">
              From Idea to Published Book
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-cream-600">
              No design experience needed. Our tools handle the technical details so you can focus on your story.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BookOpen, emoji: '1', title: 'Write Your Story', desc: 'Add pages, arrange your narrative, set text positions. The editor gives you full creative control.', color: 'bg-terracotta-50 text-terracotta-500 border-terracotta-100' },
              { icon: Sparkles, emoji: '2', title: 'AI Illustrations', desc: 'Describe your scene and our AI creates beautiful, print-quality illustrations matched to your story.', color: 'bg-sage-50 text-sage-600 border-sage-100' },
              { icon: FileDown, emoji: '3', title: 'Export KDP Files', desc: 'One click generates your interior PDF and full-wrap cover — perfectly formatted for Amazon KDP.', color: 'bg-blush-50 text-blush-500 border-blush-100' },
              { icon: CheckCircle, emoji: '4', title: 'Publish on Amazon', desc: 'Upload your files to KDP, set your price, and your book is available worldwide.', color: 'bg-cream-100 text-cream-700 border-cream-200' },
            ].map((step, i) => (
              <div key={i} className="boho-card group text-center fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${step.color}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terracotta-100 text-xs font-bold text-terracotta-600">
                    {step.emoji}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-cream-900">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-cream-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ────────────────────────── */}
      <section className="bg-boho-section py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <span className="text-3xl">&#x2728;</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-cream-900 md:text-4xl">
              Everything You Need to Publish
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
            {[
              { icon: Star, title: 'Amazon KDP Ready', desc: '8.5x8.5" trim, 0.125" bleed, 300 DPI — every spec handled automatically.', accent: 'terracotta' },
              { icon: Sparkles, title: 'AI Illustration Engine', desc: 'Powered by Grok AI. Describe your scene, get a print-quality illustration in seconds.', accent: 'sage' },
              { icon: Palette, title: 'Full-Wrap Cover Builder', desc: 'Front cover, spine, and back cover on one canvas with automatic spine width calculation.', accent: 'blush' },
              { icon: Globe, title: 'Built on Internet Computer', desc: 'Your projects live on-chain. No server to maintain. Your data is yours.', accent: 'sage' },
              { icon: FileDown, title: 'Real PDF Export', desc: 'Not a mockup — real files you can upload directly to KDP and hold in your hands.', accent: 'terracotta' },
              { icon: Shield, title: 'Professional Validation', desc: 'Automatic preflight checks catch issues before you upload. No rejected manuscripts.', accent: 'blush' },
            ].map((f, i) => (
              <div key={i} className="boho-card flex items-start gap-4 fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                  f.accent === 'terracotta' ? 'bg-terracotta-50 text-terracotta-500' :
                  f.accent === 'sage' ? 'bg-sage-50 text-sage-600' :
                  'bg-blush-50 text-blush-500'
                }`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-cream-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cream-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────── */}
      <section className="bg-boho-warm py-20">
        <div className="container mx-auto max-w-md px-4 text-center">
          <span className="text-3xl">&#x1F33B;</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-cream-900">Simple, Happy Pricing</h2>
          <p className="mt-3 text-cream-600">Try free. Subscribe when you're ready to export and publish.</p>

          <div className="mt-10 overflow-hidden rounded-3xl border-2 border-terracotta-200 bg-white p-8 shadow-boho-lg">
            <div className="rounded-full mx-auto mb-4 w-fit bg-sage-50 px-4 py-1 text-sm font-semibold text-sage-700">
              Creator Plan
            </div>
            <p className="font-display text-6xl font-bold text-cream-900">
              $9.99
              <span className="text-xl font-normal text-cream-500">/mo</span>
            </p>

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-cream-300 to-transparent" />

            <ul className="space-y-3 text-left">
              {[
                'Unlimited book projects',
                'AI-powered illustrations',
                'KDP-ready PDF export',
                'Full-wrap cover builder',
                'Cancel anytime',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-cream-700">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sage-100">
                    <CheckCircle className="h-3.5 w-3.5 text-sage-600" />
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-8 w-full rounded-full bg-terracotta-500 py-6 text-base font-bold shadow-boho hover:bg-terracotta-600 hover:shadow-boho-lg"
              size="lg"
              onClick={() => navigate({ to: '/subscribe' })}
            >
              Subscribe Now
            </Button>
            <p className="mt-3 text-xs text-cream-500">Secure checkout via Stripe</p>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-cream-900 py-20 text-center">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-terracotta-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sage-500/10 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <span className="text-4xl">&#x1F496;</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-cream-100 md:text-4xl">
            Ready to bring your story to life?
          </h2>
          <p className="mt-3 text-cream-400">
            Start building your book today — no credit card required to explore.
          </p>
          <Button
            size="lg"
            className="mt-8 gap-2 rounded-full bg-terracotta-500 px-8 text-base font-bold shadow-boho hover:bg-terracotta-400"
            onClick={() => navigate({ to: '/home' })}
          >
            <Heart className="h-4 w-4" />
            Start Your Book
          </Button>
        </div>
      </section>
    </div>
  );
}
