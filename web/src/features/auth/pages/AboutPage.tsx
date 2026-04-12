import { PublicHeader } from '../../../shared/components/PublicHeader';
import { PublicFooter } from '../../../shared/components/PublicFooter';

export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">

        <p className="mb-12 text-xs font-medium uppercase tracking-widest text-gray-400">About</p>

        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">What it is</h2>
          <p className="text-[1.0625rem] leading-relaxed text-gray-500">
            Folio is a job search companion. It gives you one place to track every role you've
            applied to — status, salary, location, source — and layers on top of that an AI-powered
            resume scoring tool and a public portfolio page you can share with anyone. No
            spreadsheets, no sticky notes, no context-switching between five different tabs.
          </p>
        </section>

        <div className="mb-16 h-px bg-gray-100" />

        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">Why I built it</h2>
          <p className="text-[1.0625rem] leading-relaxed text-gray-500">
            Folio is a project I built for a database course. The prompt
            was open-ended — build something full-stack, something real. I was in the middle of my
            own job search at the time, copying and pasting company names into a Google Sheet and
            losing track of where I'd heard back. It felt like an obvious problem to solve, so I
            built the thing I actually wanted to use.
          </p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-gray-500">
            What started as a CRUD app for tracking applications grew into something with real AI
            analysis, resume parsing, and a portfolio builder — mostly because once the core was
            working, it was hard to stop adding things that felt genuinely useful.
          </p>
        </section>

        <div className="mb-16 h-px bg-gray-100" />

        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">The goal</h2>
          <p className="text-[1.0625rem] leading-relaxed text-gray-500">
            Help people get jobs. That's it. The job search is already stressful — the tools you
            use to manage it shouldn't add to that. Folio is meant to reduce the overhead so you
            can spend more time on the parts that actually matter: writing good cover letters,
            prepping for interviews, and finding roles that are actually a good fit.
          </p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-gray-500">
            If it helps even one person stay organized through a tough search, it was worth building.
          </p>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
