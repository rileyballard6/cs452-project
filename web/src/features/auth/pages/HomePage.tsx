import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { PublicHeader } from "../../../shared/components/PublicHeader";
import { PublicFooter } from "../../../shared/components/PublicFooter";
import { userService } from "../../../services/user.service";
import { Search, Sparkles, Bell, Globe, FileCheck, Briefcase, FileText, Building2, TrendingUp, DollarSign, MapPin, Star } from "lucide-react";
import dashboardImg from "../../../assets/dashboard.png";
import aiImg from "../../../assets/ai_overview.png";
import profileImg from "../../../assets/public_profile.png";
import skillsImg from "../../../assets/skills_projects.png";

function usernameValid(u: string) {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

const HERO_FEATURE = {
  title: "Job pipeline",
  body: "One place for every role you're tracking — status, salary, source, and full timeline.",
  color: "bg-[rgb(68,129,216)]",
  img: dashboardImg,
};

const PAIR_FEATURES = [
  {
    title: "Public portfolio",
    body: "Share your work at folio.app/u/yourname — no extra setup.",
    color: "bg-[rgb(95,159,117)]",
    img: profileImg,
  },
  {
    title: "Skills & projects",
    body: "Showcase what you know and what you've built, all on one page.",
    color: "bg-[rgb(213,108,94)]",
    img: skillsImg,
  },
];

const SOLO_FEATURE = {
  title: "AI resume scoring",
  body: "Paste a job description and get an instant fit score with gaps called out.",
  color: "bg-[rgb(208,165,72)]",
  img: aiImg,
};

const FLOATING_ICONS = [
  { icon: <Briefcase size={20} />,    color: 'text-[rgb(68,129,216)]',  bg: 'bg-[rgb(213,227,246)]',  top: '12%',  left: '18%',  duration: 4.2, delay: 0    },
  { icon: <Sparkles size={20} />,     color: 'text-[rgb(208,165,72)]',  bg: 'bg-[rgb(240,228,198)]',  top: '30%',  left: '14%',  duration: 5.1, delay: 0.8  },
  { icon: <FileText size={20} />,     color: 'text-[rgb(95,159,117)]',  bg: 'bg-[rgb(221,230,222)]',  top: '55%',  left: '19%',  duration: 3.8, delay: 1.5  },
  { icon: <MapPin size={20} />,       color: 'text-[rgb(213,108,94)]',  bg: 'bg-[rgb(244,221,218)]',  top: '72%',  left: '15%',  duration: 4.7, delay: 0.4  },
  { icon: <Building2 size={20} />,    color: 'text-[rgb(68,129,216)]',  bg: 'bg-[rgb(213,227,246)]',  top: '10%',  right: '18%', duration: 4.5, delay: 1.2  },
  { icon: <TrendingUp size={20} />,   color: 'text-[rgb(95,159,117)]',  bg: 'bg-[rgb(221,230,222)]',  top: '30%',  right: '14%', duration: 5.3, delay: 0.2  },
  { icon: <DollarSign size={20} />,   color: 'text-[rgb(208,165,72)]',  bg: 'bg-[rgb(240,228,198)]',  top: '58%',  right: '19%', duration: 4.0, delay: 1.8  },
  { icon: <Star size={20} />,         color: 'text-[rgb(213,108,94)]',  bg: 'bg-[rgb(244,221,218)]',  top: '74%',  right: '15%', duration: 3.6, delay: 0.6  },
];

const MINI_CARDS = [
  {
    icon: <Sparkles size={15} />,
    color: "text-[rgb(208,165,72)]",
    bg: "bg-[rgb(240,228,198)]",
    text: "Know your fit score before you apply",
  },
  {
    icon: <Bell size={15} />,
    color: "text-[rgb(68,129,216)]",
    bg: "bg-[rgb(213,227,246)]",
    text: "Never lose track of where you stand",
  },
  {
    icon: <Globe size={15} />,
    color: "text-[rgb(95,159,117)]",
    bg: "bg-[rgb(221,230,222)]",
    text: "Portfolio live at your own URL",
  },
  {
    icon: <FileCheck size={15} />,
    color: "text-[rgb(213,108,94)]",
    bg: "bg-[rgb(244,221,218)]",
    text: "Resume parsed and structured by AI",
  },
];

export function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(user?.onboardingComplete ? "/applications" : "/onboarding", {
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const checkUsername = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!usernameValid(val)) {
      setAvailable(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await userService.checkUsernamePublic(val);
        setAvailable(available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 450);
  }, []);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(val);
    setAvailable(null);
    checkUsername(val);
  }

  if (isLoading) return null;

  return (
    <div className="bg-white">
      <PublicHeader />

      {/* Hero — full viewport height */}
      <section className="relative flex min-h-[calc(100vh-52px)] items-center justify-center overflow-hidden px-6 text-center">

        {/* Floating icons — hidden on small screens */}
        {FLOATING_ICONS.map((item, i) => (
          <div
            key={i}
            className={`animate-float absolute hidden xl:flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${item.bg}`}
            style={{
              top: item.top,
              left: 'left' in item ? item.left : undefined,
              right: 'right' in item ? item.right : undefined,
              '--float-duration': `${item.duration}s`,
              '--float-delay': `${item.delay}s`,
            } as React.CSSProperties}
          >
            <span className={item.color}>{item.icon}</span>
          </div>
        ))}

        <div className="relative z-10 w-full max-w-2xl">

          {/* Mobile icon row — above headline */}
          <div className="mb-10 flex justify-center gap-3 xl:hidden">
            {FLOATING_ICONS.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className={`animate-float flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${item.bg}`}
                style={{ '--float-duration': `${item.duration}s`, '--float-delay': `${item.delay}s` } as React.CSSProperties}
              >
                <span className={item.color}>{item.icon}</span>
              </div>
            ))}
          </div>

          <h1 className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight text-gray-900">
            Your job search,
            <br />
            organized.
          </h1>
          <p className="mx-auto mb-12 max-w-md text-lg leading-relaxed text-gray-400">
            Track applications, score your resume with AI, and share your work —
            all in one place.
          </p>

          {/* Username search */}
          <div className="mx-auto max-w-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">
              Claim your handle
            </p>
            <div className="flex items-center rounded-xl border border-gray-200 px-3.5 transition-colors focus-within:border-gray-400">
              <span className="shrink-0 select-none text-base text-gray-300">folio.app/u/</span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="yourname"
                maxLength={20}
                className="min-w-0 flex-1 py-3 pr-2 text-base text-gray-800 outline-none placeholder:text-gray-300"
              />
              <div className="shrink-0">
                {checking && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
                )}
                {!checking && available === true && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(221,230,222)]">
                    <span className="h-2 w-2 rounded-full bg-[rgb(95,159,117)]" />
                  </span>
                )}
                {!checking && available === false && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(244,221,218)]">
                    <span className="h-2 w-2 rounded-full bg-[rgb(213,108,94)]" />
                  </span>
                )}
                {!checking && !username && (
                  <Search size={14} className="text-gray-300" />
                )}
              </div>
            </div>
            {username && !checking && available === false && (
              <p className="mt-2 text-xs text-[rgb(213,108,94)]">
                folio.app/u/{username} is taken
              </p>
            )}
            {username && !checking && available === true && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[rgb(221,230,222)] bg-[rgb(240,248,242)] px-4 py-3">
                <p className="text-xs text-[rgb(95,159,117)]">
                  <span className="font-semibold">folio.app/u/{username}</span> is available
                </p>
                <Link
                  to={`/login?username=${encodeURIComponent(username)}`}
                  className="rounded-lg bg-[rgb(95,159,117)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                >
                  Claim it →
                </Link>
              </div>
            )}
            {username && !usernameValid(username) && username.length > 0 && (
              <p className="mt-2 text-xs text-gray-400">
                3–20 chars, letters, numbers, and _ only
              </p>
            )}
          </div>

          {/* Mobile icon row — below search */}
          <div className="mt-10 flex justify-center gap-3 xl:hidden">
            {FLOATING_ICONS.slice(4).map((item, i) => (
              <div
                key={i}
                className={`animate-float flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${item.bg}`}
                style={{ '--float-duration': `${item.duration}s`, '--float-delay': `${item.delay}s` } as React.CSSProperties}
              >
                <span className={item.color}>{item.icon}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Features + About — slightly grey background */}

      <div className="bg-[rgb(247,247,246)]">
        <section id="features" className="mx-auto max-w-6xl px-8 py-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

            {/* Row 1: full-width — stacks vertically on mobile, horizontal on desktop */}
            <div className={`col-span-1 flex flex-col overflow-hidden rounded-2xl md:col-span-4 md:min-h-[300px] md:flex-row ${HERO_FEATURE.color}`}>
              <div className="flex flex-col justify-center bg-white px-8 py-8 md:w-[30%] md:shrink-0">
                <p className="mb-2 text-xl font-bold tracking-tight text-gray-900">{HERO_FEATURE.title}</p>
                <p className="text-sm leading-relaxed text-gray-500">{HERO_FEATURE.body}</p>
              </div>
              <div className="h-4 shrink-0 md:h-auto md:w-4" />
              <div className="px-4 pb-4 md:flex-1 md:py-4 md:pl-0 md:pr-4">
                <div className="overflow-hidden rounded-xl bg-white">
                  <img src={HERO_FEATURE.img} alt={HERO_FEATURE.title} className="w-full object-cover object-top" />
                </div>
              </div>
            </div>

            {/* Row 2: stacks on mobile, side-by-side on desktop */}
            {PAIR_FEATURES.map((f) => (
              <div key={f.title} className={`col-span-1 overflow-hidden rounded-2xl pb-4 md:col-span-2 ${f.color}`}>
                <div className="bg-white px-6 py-5">
                  <p className="mb-1 text-sm font-bold tracking-tight text-gray-900">{f.title}</p>
                  <p className="text-xs leading-relaxed text-gray-500">{f.body}</p>
                </div>
                <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-white">
                  <img src={f.img} alt={f.title} className="w-full" />
                </div>
              </div>
            ))}

            {/* Row 3 left: solo card */}
            <div className={`col-span-1 overflow-hidden rounded-2xl pb-4 md:col-span-2 ${SOLO_FEATURE.color}`}>
              <div className="bg-white px-6 py-5">
                <p className="mb-1 text-sm font-bold tracking-tight text-gray-900">{SOLO_FEATURE.title}</p>
                <p className="text-xs leading-relaxed text-gray-500">{SOLO_FEATURE.body}</p>
              </div>
              <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-white">
                <img src={SOLO_FEATURE.img} alt={SOLO_FEATURE.title} className="w-full" />
              </div>
            </div>

            {/* Row 3 right: mini cards — always 2×2 */}
            <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-2">
              {MINI_CARDS.map((m) => (
                <div key={m.text} className="flex flex-col justify-between rounded-xl bg-white p-5">
                  <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full ${m.bg} ${m.color}`}>
                    {m.icon}
                  </div>
                  <p className="text-sm font-semibold leading-snug text-gray-800">{m.text} &rarr;</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* About */}
      </div>

      <PublicFooter />
    </div>
  );
}
