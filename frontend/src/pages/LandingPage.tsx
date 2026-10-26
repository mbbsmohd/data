import React, { useState, useEffect } from 'react';
import {
  Wifi, Phone, Sun, Tv, Repeat, ShieldCheck, Zap, Award,
  ArrowRight, CheckCircle2, Lock, Smartphone, Globe, Code,
  ChevronRight, Megaphone, Server, Printer, Mail, Layers,
  Star, ChevronDown, Check, HelpCircle, UserCheck, DollarSign
} from 'lucide-react';
import { api } from '../services/api';

export const LandingPage: React.FC<{
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  settings?: any;
}> = ({ onOpenLogin, onOpenRegister, settings = {} }) => {
  const [calcNetwork, setCalcNetwork] = useState('MTN');
  const [calcPlan, setCalcPlan] = useState('1GB');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cmsSections, setCmsSections] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<any[]>([
    {
      id: 'tst_001',
      author_name: 'Ibrahim Danladi',
      author_role: 'SME Data Merchant (Kano)',
      rating: 5,
      content: 'Bukar Data Sub has completely transformed my daily reselling business. SME data delivery takes less than 3 seconds, and the automated PalmPay/Monnify virtual accounts fund my wallet instantaneously with zero manual verification delays.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'tst_002',
      author_name: 'Aisha Bello',
      author_role: 'POS & Agency Banking Operator (Kaduna)',
      rating: 5,
      content: 'The 16-digit SunKing Solar activation PIN engine is 100% dependable. My rural customers get their light back instantly without downtime. The UI is super fast and clean.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'tst_003',
      author_name: 'Emeka Okafor',
      author_role: 'Software Engineer & API Reseller (Lagos)',
      rating: 5,
      content: 'Their Reseller API with strict HMAC webhooks, rate limiting, and 99.98% uptime SLA is the best in Nigeria. We route over 4,000 requests daily with zero discrepancies.',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    }
  ]);

  useEffect(() => {
    api.getPublicTestimonials()
      .then(res => {
        if (res?.success && res.testimonials?.length > 0) {
          setTestimonials(res.testimonials);
        }
      })
      .catch(() => {});

    api.getCmsSections()
      .then(res => {
        if (res?.success && res.sections) {
          setCmsSections(res.sections);
        }
      })
      .catch(() => {});
  }, []);

  const appName = settings.app_name || 'Bukar Data Sub';
  const appTagline = settings.app_tagline || 'Automated Telecom & Data Platform';
  const announcementText = settings.announcement_text;
  const isAnnouncementActive = Boolean(settings.announcement_active);
  const announcementType = settings.announcement_type || 'info';

  const heroContent = cmsSections?.hero?.content || {};
  const heroBadge = heroContent.badgeText || 'Nigeria’s Premier High-Speed Telecom & Data Delivery Platform';
  const heroHeadline = heroContent.headline || 'Cheapest SME Data, Instant Airtime, SunKing Solar PINs & Bill Settlements.';
  const heroSubheadline = heroContent.subheadline || 'Automated VTU delivery, reserved virtual bank accounts, airtime-to-cash exchange, recharge voucher printing, examination scratch cards, and telecom SIM hosting gateways.';
  const heroCtaPrimary = heroContent.ctaPrimaryText || 'Create Free Account';
  const heroCtaSecondary = heroContent.ctaSecondaryText || 'Access Portal Login';

  const footerContent = cmsSections?.contact_footer?.content || {};
  const footerEmail = footerContent.supportEmail || settings.support_email || 'support@bukardatasub.com';
  const footerPhone = footerContent.supportPhone || settings.support_phone || '09131797675';
  const footerAddress = footerContent.address || 'Suite 402, Technology Innovation Hub, Ahmadu Bello Way, Abuja, Nigeria';
  const footerCopyright = footerContent.copyrightText || `© 2026 ${appName}. All rights reserved.`;

  const getPlanPrice = () => {
    if (calcNetwork === 'MTN') return calcPlan === '1GB' ? 260 : calcPlan === '2GB' ? 520 : 1300;
    if (calcNetwork === 'AIRTEL') return calcPlan === '1GB' ? 280 : calcPlan === '2GB' ? 560 : 1400;
    if (calcNetwork === 'GLO') return calcPlan === '1GB' ? 240 : calcPlan === '2GB' ? 480 : 1200;
    return calcPlan === '1GB' ? 350 : calcPlan === '2GB' ? 700 : 1750;
  };

  const faqs = [
    {
      q: 'How fast is SME data delivered to recipient lines?',
      a: 'All MTN, Airtel, and Glo data orders are delivered directly via our authoritative high-speed API gateway and dedicated SIM hosting modem cluster within 1 to 3 seconds of PIN confirmation.'
    },
    {
      q: 'How do automated virtual accounts work?',
      a: 'When you register, you are assigned dedicated NUBAN virtual bank accounts (Wema Bank, Titan Bank, PalmPay, Moniepoint). Any bank transfer sent to your dedicated account automatically credits your wallet balance 24/7 with zero manual admin intervention.'
    },
    {
      q: 'Can I print recharge vouchers with my own business name?',
      a: 'Yes! Our Recharge Card Printing engine generates authentic 16-digit telecom voucher PINs with customizable denomination batches and your business brand name printed directly on the vouchers.'
    },
    {
      q: 'How do I integrate the Reseller API with my website?',
      a: 'Visit the Developer API portal in your dashboard to generate your production API Key and IP allowlist. We provide comprehensive documentation, Postman collections, and HMAC-signed webhook delivery.'
    },
    {
      q: 'Are transactions protected against double-debiting?',
      a: 'Yes. Every transaction is guarded by an enterprise 60-second duplicate prevention engine, mandatory Idempotency-Key headers, and an immutable SQLite double-entry ledger that guarantees mathematical balance integrity.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Live System Announcement Broadcast Bar */}
      {isAnnouncementActive && announcementText && (
        <div className={`px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center space-x-2 border-b transition ${
          announcementType === 'warning'
            ? 'bg-amber-500 text-amber-950 border-amber-600'
            : announcementType === 'danger'
            ? 'bg-red-600 text-white border-red-700'
            : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white border-blue-900 shadow-inner'
        }`}>
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span className="tracking-wide">{announcementText}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={appName} className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
                {appName.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">{appName}</span>
              <span className="block text-[10px] font-bold text-blue-600 tracking-widest uppercase">{appTagline}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600">
            <a href="#services" className="hover:text-blue-600 transition">Services</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing Calculator</a>
            <a href="#howitworks" className="hover:text-blue-600 transition">How It Works</a>
            <a href="#testimonials" className="hover:text-blue-600 transition">Testimonials</a>
            <a href="#developers" className="hover:text-blue-600 transition">Developer APIs</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenLogin}
              className="text-xs font-bold text-slate-700 hover:text-blue-600 px-4 py-2 transition"
            >
              Sign In
            </button>
            <button
              onClick={onOpenRegister}
              className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
            >
              Create Account
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-blue-50/50 via-white to-white relative overflow-hidden">
        {/* Decorative Ambient Background Glow & Grids */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/15 to-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>{heroBadge}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight">
            {heroHeadline}
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            {heroSubheadline}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto bg-blue-600 text-white font-bold text-sm px-8 py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <span>{heroCtaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto bg-slate-100 text-slate-800 font-bold text-sm px-8 py-4 rounded-2xl hover:bg-slate-200 transition"
            >
              {heroCtaSecondary}
            </button>
          </div>

          {/* Performance & Security Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Double-Entry Atomic Wallet Ledger</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Sub-second USSD & API Gateway</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-blue-600" />
              <span>99.98% Service Uptime SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Platform Metrics Banner */}
      <section className="py-12 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-black text-blue-400 font-mono">99.98%</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Gateway Uptime</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-emerald-400 font-mono">&lt; 3 Secs</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Average Delivery</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-purple-400 font-mono">24/7</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Automated Funding</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-amber-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Ledger Integrity</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howitworks" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block mb-2">Simplicity & Speed</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">How It Works in 3 Easy Steps</h2>
            <p className="text-slate-500 text-xs font-medium mt-2">
              Start reselling telecom services or funding your personal devices in less than two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                1
              </div>
              <h3 className="text-lg font-black text-slate-900">Create Free Account</h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                Register with your basic details and set your authoritative 4-digit security transaction PIN. No complex paperwork required.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20">
                2
              </div>
              <h3 className="text-lg font-black text-slate-900">Instant Wallet Funding</h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                Transfer to your dedicated virtual bank accounts (Wema Bank, Titan Bank, PalmPay, Moniepoint) for 100% automated credit.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-lg font-black text-slate-900">Instant Purchase & Delivery</h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                Enjoy wholesale SME data, 16-digit solar tokens, airtime, and utility bill renewals with sub-second confirmation and digital receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section id="services" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Complete Service Architecture</h2>
            <p className="text-slate-500 text-xs font-medium mt-2">
              Every service operates with authoritative backend logic, real database persistence, and multi-channel notification alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'SME Data Bundles', desc: 'MTN, Airtel, Glo, 9mobile 30-day corporate gifting and direct bundles with instant delivery.', icon: Wifi, color: 'text-blue-600 bg-blue-50' },
              { title: 'Instant Airtime Top-Up', desc: 'Direct VTU airtime recharge across all networks with up to 5% cash-back wholesale margins.', icon: Phone, color: 'text-purple-600 bg-purple-50' },
              { title: 'SunKing Solar PIN', desc: 'Instant 16-digit lighting and solar home system activation codes for all SunKing accounts.', icon: Sun, color: 'text-amber-600 bg-amber-50' },
              { title: 'Cable TV Renewal', desc: 'Instant smartcard verification and subscription renewal for DStv, GOtv, and StarTimes bouquets.', icon: Tv, color: 'text-sky-600 bg-sky-50' },
              { title: 'Electricity Tokens', desc: '20-digit prepaid meter token generation and postpaid utility bill payments nationwide.', icon: Zap, color: 'text-yellow-600 bg-yellow-50' },
              { title: 'Recharge Card Printing', desc: 'Batch e-PIN voucher generation for printing customized recharge scratch cards with your business branding.', icon: Printer, color: 'text-emerald-600 bg-emerald-50' },
              { title: 'Bulk SMS Portal', desc: 'High-speed corporate SMS messaging with custom Sender ID and instant delivery reports.', icon: Mail, color: 'text-indigo-600 bg-indigo-50' },
              { title: 'Exam PINs & Vouchers', desc: 'Official WAEC Result Checkers, NECO Tokens, and JAMB registration tokens with printable candidate slips.', icon: Award, color: 'text-rose-600 bg-rose-50' }
            ].map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:-translate-y-1 transition duration-200 flex flex-col justify-between">
                  <div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${srv.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{srv.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">{srv.desc}</p>
                  </div>
                  <button
                    onClick={onOpenLogin}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mt-4 pt-3 border-t border-slate-100"
                  >
                    <span>Purchase Service</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Pricing Calculator */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-xl">
              <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Live Pricing Calculator
              </span>
              <h2 className="text-3xl font-black mt-4">Calculate Instant Wholesale Margins</h2>
              <p className="text-blue-100 text-xs font-medium mt-2">
                Resellers, agents, and bulk dealers enjoy exclusive wholesale pricing across all 4 major Nigerian GSM networks.
              </p>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-xs font-bold text-blue-100 block mb-2">Select Network</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map(net => (
                      <button
                        key={net}
                        onClick={() => setCalcNetwork(net)}
                        className={`py-2 text-xs font-extrabold rounded-xl transition ${
                          calcNetwork === net ? 'bg-white text-blue-700 shadow-md' : 'bg-blue-700/60 text-white hover:bg-blue-700'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-blue-100 block mb-2">Plan Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1GB', '2GB', '5GB'].map(sz => (
                      <button
                        key={sz}
                        onClick={() => setCalcPlan(sz)}
                        className={`py-2 text-xs font-extrabold rounded-xl transition ${
                          calcPlan === sz ? 'bg-white text-blue-700 shadow-md' : 'bg-blue-700/60 text-white hover:bg-blue-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-950/40 p-4 rounded-2xl border border-blue-400/30 flex items-center justify-between mt-6">
                  <div>
                    <span className="text-xs text-blue-200">Wholesale Rate</span>
                    <div className="text-3xl font-black font-mono">₦{getPlanPrice()}</div>
                  </div>
                  <button
                    onClick={onOpenRegister}
                    className="bg-white text-blue-700 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow"
                  >
                    Get Wholesale Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Customer Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block mb-2">Social Proof & Trust</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Loved by Merchants, Agents & Resellers</h2>
            <p className="text-slate-500 text-xs font-medium mt-2">
              See what business owners and developers across Nigeria say about our automated delivery engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t: any) => (
              <div key={t.id} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-4">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                    "{t.content}"
                  </p>
                </div>

                <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-slate-100">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      {t.author_name?.[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">{t.author_name}</span>
                    <span className="text-[11px] text-slate-400 block font-normal">{t.author_role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer API Documentation Preview */}
      <section id="developers" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest">
                Developer REST API
              </span>
              <h2 className="text-3xl md:text-4xl font-black mt-2 tracking-tight">
                High-Concurrency REST API for Apps, Portals & POS
              </h2>
              <p className="text-slate-400 text-xs font-medium mt-4 leading-relaxed">
                Connect your business website or mobile application to our automated engine. Benefit from granular IP allowlisting, custom daily quotas, idempotency keys, and instant webhook dispatches.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-300 font-medium">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Double-entry ledger prevents double-debiting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>HMAC-SHA512 signed webhooks with replay protection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Dual routing support: Normal API Provider or Local SIM Hosting</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-2xl">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-800 text-slate-500 text-[11px]">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="ml-2 font-bold text-slate-400">POST /api/vtu/purchase</span>
              </div>
              <pre className="mt-4 text-emerald-400 font-mono text-[11px] leading-relaxed">{`curl -X POST https://api.abkdata.com/api/vtu/purchase \\
  -H "Authorization: Bearer abk_live_4a919f8..." \\
  -H "Idempotency-Key: TXN-REQ-981249" \\
  -H "Content-Type: application/json" \\
  -d '{
    "category": "solar_pin",
    "billerOrNetwork": "SUNKING",
    "recipient": "SUN-8891238",
    "amount": 2200
  }'`}</pre>
              <div className="mt-4 pt-4 border-t border-slate-800 text-blue-400 text-[11px]">{`// Response 200 OK
{
  "success": true,
  "status": "COMPLETED",
  "tokenOrPin": "2531-9284-7653-2715",
  "chargedAmount": 2200.00,
  "reference": "VTU-A91B4C"
}`}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block mb-2">Got Questions?</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-xs font-medium mt-1">Everything you need to know about our services and security.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-xs text-slate-600 font-medium leading-relaxed bg-white border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Ready to Supercharge Your Telecom Business?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto">
            Join thousands of active Nigerian merchants, POS operators, and smart individuals who save daily on data and bills.
          </p>
          <div>
            <button
              onClick={onOpenRegister}
              className="bg-white text-blue-700 hover:bg-blue-50 font-black text-sm px-8 py-4 rounded-2xl transition shadow-xl"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <p className="font-extrabold text-slate-800 text-base">{appName}</p>
          <p className="text-slate-600 font-medium">{appTagline}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-slate-500 font-semibold text-[11px]">
            <span>Email: <a href={`mailto:${footerEmail}`} className="text-blue-600 hover:underline">{footerEmail}</a></span>
            <span>Tel: <a href={`tel:${footerPhone}`} className="text-blue-600 hover:underline">{footerPhone}</a></span>
            <span>Office: {footerAddress}</span>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
            <span>{footerCopyright}</span>
            <a
              href="#/admin/login"
              className="text-slate-400 hover:text-slate-700 transition flex items-center gap-1.5 font-medium"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Administrative Staff Portal</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
