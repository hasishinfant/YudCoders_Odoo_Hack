import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const appRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = appRef.current;
    if (!root) return;

    /* ---------------- SCROLL REVEAL ---------------- */
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          }
        });
      },
      { threshold: 0.2 }
    );

    root.querySelectorAll(".reveal").forEach((element) => {
      revealObserver.observe(element);
    });

    /* ---------------- BAR / DONUT CHARTS ---------------- */
    const chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.classList.add("in");

          /* Bar chart */
          if (element.id === "barCard") {
            element.querySelectorAll<HTMLElement>(".fill").forEach((bar) => {
              bar.style.height = `${bar.dataset.height}%`;
            });
          }

          /* Donut chart */
          if (element.id === "donutCard") {
            const circumference = 2 * Math.PI * 45;
            element.querySelectorAll<HTMLElement>(".segment").forEach((segment) => {
              const percentage = parseFloat(segment.dataset.percentage || "0") / 100;
              const offset = parseFloat(segment.dataset.offset || "0") / 100;
              segment.style.strokeDasharray = `${circumference * percentage} ${circumference}`;
              segment.style.strokeDashoffset = `${-circumference * offset}`;
            });
          }

          chartObserver.unobserve(element);
        });
      },
      { threshold: 0.35 }
    );

    ["barCard", "donutCard", "lineCard"].forEach((id) => {
      const element = root.querySelector(`#${id}`);
      if (element) chartObserver.observe(element);
    });

    /* ---------------- COUNTERS ---------------- */
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          const target = Number(element.dataset.target);
          let current = 0;
          const step = Math.max(1, Math.ceil(target / 40));
          const animate = () => {
            current += step;
            if (current >= target) {
              element.textContent = String(target);
              return;
            }
            element.textContent = String(current);
            requestAnimationFrame(animate);
          };
          animate();
          counterObserver.unobserve(element);
        });
      },
      { threshold: 0.5 }
    );

    root.querySelectorAll(".counter-number").forEach((element) => {
      counterObserver.observe(element);
    });

    return () => {
      revealObserver.disconnect();
      chartObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #ffffff; color: #101425; font-family: Inter, Arial, sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        button { font-family: inherit; }
        a { text-decoration: none; }
        ::selection { background: #dde8ff; color: #1b4fd1; }
        h1, h2, h3 { font-family: "Space Grotesk", Inter, sans-serif; letter-spacing: -0.02em; }
        section { position: relative; z-index: 2; }

        .bg-flow { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(circle at 15% 10%, #dde8ff 0%, transparent 40%),
                      radial-gradient(circle at 90% 30%, #ffe4d1 0%, transparent 35%);
          opacity: 0.75; }
        .bg-flow svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .flow-path { fill: none; stroke: url(#flowGradient); stroke-width: 2; stroke-dasharray: 12 10; animation: dash 18s linear infinite; opacity: 0.3; }
        @keyframes dash { to { stroke-dashoffset: -440; } }

        nav { position: relative; z-index: 5; display: flex; align-items: center; justify-content: space-between; padding: 20px 5vw; }
        .logo { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 19px; }
        .logo-dot { width: 11px; height: 11px; border-radius: 50%; background: linear-gradient(135deg, #2f6fed, #ff7a2f); animation: pulse 2.4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.35); } }
        .nav-links { display: flex; gap: 26px; font-size: 14px; color: #5b6172; font-weight: 500; }
        .nav-links a { color: inherit; transition: 0.2s; }
        .nav-links a:hover { color: #2f6fed; }

        .btn { border: none; cursor: pointer; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 100px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease; }
        .btn-primary { color: white; background: #2f6fed; box-shadow: 0 10px 24px -8px rgba(47,111,237,0.5); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -8px rgba(47,111,237,0.6); }
        .btn-ghost { background: white; color: #101425; border: 1.5px solid #e7ebf3; }
        .btn-ghost:hover { border-color: #2f6fed; color: #2f6fed; }

        .hero { display: grid; grid-template-columns: 1.05fr 0.95fr; align-items: center; gap: 30px; padding: 28px 5vw 40px; min-height: 70vh; }
        .eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #1b4fd1; background: #dde8ff; padding: 7px 14px; border-radius: 100px; margin-bottom: 20px; opacity: 0; animation: riseIn 0.7s ease forwards; }
        .eyebrow-bar { width: 6px; height: 6px; border-radius: 50%; background: #ff7a2f; }
        .headline { font-size: clamp(34px, 4.2vw, 54px); font-weight: 700; line-height: 1.05; color: #101425; opacity: 0; animation: riseIn 0.8s ease forwards; animation-delay: 0.22s; }
        .headline-accent { background: linear-gradient(100deg, #2f6fed, #ff7a2f); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .subtitle { margin-top: 18px; font-size: 16.5px; color: #5b6172; max-width: 470px; line-height: 1.6; opacity: 0; animation: riseIn 0.8s ease forwards; animation-delay: 0.34s; }
        .hero-buttons { margin-top: 26px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; opacity: 0; animation: riseIn 0.8s ease forwards; animation-delay: 0.46s; }
        .portal-chips { margin-top: 22px; display: flex; gap: 10px; flex-wrap: wrap; opacity: 0; animation: riseIn 0.8s ease forwards; animation-delay: 0.58s; }
        .chip { display: flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 100px; border: 1.5px solid #e7ebf3; font-size: 13px; font-weight: 600; color: #101425; background: white; cursor: pointer; transition: 0.2s; }
        .chip:hover { border-color: #2f6fed; background: #dde8ff; color: #1b4fd1; transform: translateY(-2px); }
        .chip-dot { width: 7px; height: 7px; border-radius: 50%; }
        .chip-blue { background: #2f6fed; }
        .chip-orange { background: #ff7a2f; }
        .chip-green { background: #2fbf6d; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .stage { position: relative; height: 490px; opacity: 0; animation: riseIn 1s ease forwards; animation-delay: 0.3s; }
        .card { position: absolute; background: white; border: 1px solid #e7ebf3; border-radius: 18px; box-shadow: 0 30px 60px -25px rgba(16,20,37,0.22); }
        .main-card { width: 100%; height: 100%; padding: 22px 24px; z-index: 2; animation: floatMain 6s ease-in-out infinite; }
        @keyframes floatMain { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        .main-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .main-title { font-weight: 600; font-size: 14px; }
        .live-pill { font-size: 10.5px; background: #ffe4d1; color: #c1541a; padding: 4px 10px; border-radius: 100px; font-weight: 600; }
        .tile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .tile { border: 1px solid #e7ebf3; border-radius: 12px; padding: 12px; }
        .tile-label { font-size: 10.5px; color: #5b6172; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .tile-value { font-family: "Space Grotesk", Inter, sans-serif; font-weight: 700; font-size: 21px; margin-top: 4px; }
        .tile-blue { color: #1b4fd1; }
        .tile-orange { color: #c1541a; }
        .tile-delta { font-size: 11px; font-weight: 600; color: #2fbf6d; margin-top: 2px; }
        .spark { width: 100%; height: 56px; }
        .spark-line { fill: none; stroke: #2f6fed; stroke-width: 2.4; }
        .spark-fill { stroke: none; fill: url(#sparkFill); }
        .spark-dot { fill: #ff7a2f; animation: blink 1.8s ease-in-out infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .floating-card { z-index: 3; padding: 14px 16px; }
        .attendance-card { top: -18px; right: -16px; width: 150px; animation: floatAttendance 5s ease-in-out infinite; }
        @keyframes floatAttendance { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-13px) rotate(1deg); } }
        .candidate-card { bottom: -14px; left: -30px; width: 200px; animation: floatCandidate 5.6s ease-in-out infinite; }
        @keyframes floatCandidate { 0%, 100% { transform: translateY(0) rotate(1.5deg); } 50% { transform: translateY(11px) rotate(-1deg); } }
        .ring-wrapper { display: flex; align-items: center; gap: 10px; }
        .ring { width: 46px; height: 46px; position: relative; }
        .ring svg { transform: rotate(-90deg); }
        .ring circle { fill: none; stroke-width: 6; }
        .ring-track { stroke: #e7ebf3; }
        .ring-progress { stroke: #2f6fed; stroke-linecap: round; stroke-dasharray: 132; stroke-dashoffset: 132; animation: fillRing 2s ease forwards; animation-delay: 0.6s; }
        @keyframes fillRing { to { stroke-dashoffset: 26; } }
        .ring-number { font-family: "Space Grotesk", Inter, sans-serif; font-weight: 700; font-size: 16px; }
        .ring-label { font-size: 10px; color: #5b6172; }
        .candidate-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .status-row { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; padding: 6px 0; border-bottom: 1px solid #e7ebf3; }
        .status-row:last-child { border-bottom: none; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .approved { background: #2fbf6d; }
        .pending { background: #ff7a2f; }
        .status-number { margin-left: auto; color: #5b6172; font-size: 10.5px; }

        .portals { padding: 60px 5vw 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 14px; }
        .section-header h2 { font-size: clamp(26px, 3vw, 32px); font-weight: 700; }
        .section-header p { color: #5b6172; max-width: 380px; font-size: 14px; }
        .portal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .portal-card { border: 1px solid #e7ebf3; border-radius: 20px; padding: 26px; background: white; position: relative; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .portal-card:hover { transform: translateY(-8px); box-shadow: 0 26px 50px -22px rgba(16,20,37,0.28); }
        .portal-card::before { content: ""; position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; background: var(--glow); opacity: 0.6; filter: blur(6px); transition: 0.3s; }
        .portal-card:hover::before { transform: scale(1.3); }
        .hr-card { --glow: #dde8ff; }
        .candidate-portal { --glow: #ffe4d1; }
        .admin-portal { --glow: #e3f7ec; }
        .portal-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px; position: relative; z-index: 1; }
        .hr-card .portal-icon { background: #dde8ff; color: #1b4fd1; }
        .candidate-portal .portal-icon { background: #ffe4d1; color: #c1541a; }
        .admin-portal .portal-icon { background: #e3f7ec; color: #1f8a4c; }
        .portal-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; position: relative; z-index: 1; }
        .portal-description { font-size: 13.5px; color: #5b6172; line-height: 1.55; margin-bottom: 16px; position: relative; z-index: 1; }
        .portal-card ul { list-style: none; margin-bottom: 18px; position: relative; z-index: 1; }
        .portal-card li { font-size: 12.5px; color: #101425; padding: 5px 0; display: flex; align-items: center; gap: 8px; }
        .portal-card li::before { content: "✓"; color: #2f6fed; font-weight: 700; font-size: 11px; }
        .candidate-portal li::before { color: #c1541a; }
        .admin-portal li::before { color: #1f8a4c; }
        .portal-link { font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; position: relative; z-index: 1; }
        .hr-card .portal-link { color: #1b4fd1; }
        .candidate-portal .portal-link { color: #c1541a; }
        .admin-portal .portal-link { color: #1f8a4c; }
        .arrow { transition: 0.2s; }
        .portal-card:hover .arrow { transform: translateX(4px); }

        .stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #e7ebf3; border-bottom: 1px solid #e7ebf3; background: #f7f9fc; margin-top: 56px; }
        .stat-cell { padding: 24px 5vw; text-align: left; border-right: 1px solid #e7ebf3; }
        .stat-cell:last-child { border-right: none; }
        .stat-number { font-family: "Space Grotesk", Inter, sans-serif; font-weight: 700; font-size: 25px; }
        .stat-accent { color: #2f6fed; font-size: 13px; font-weight: 600; }
        .stat-label { font-size: 12.5px; color: #5b6172; margin-top: 3px; }

        .analytics { padding: 64px 5vw; }
        .counter-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .counter-card { border: 1px solid #e7ebf3; border-radius: 14px; padding: 18px; background: white; }
        .counter-number { font-family: "Space Grotesk", Inter, sans-serif; font-weight: 700; font-size: 28px; }
        .counter-label { font-size: 12px; color: #5b6172; margin-top: 2px; }
        .chart-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 16px; }
        .chart-card { border: 1px solid #e7ebf3; border-radius: 18px; padding: 22px; background: white; }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .chart-title { font-weight: 600; font-size: 14px; }
        .chart-tag { font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 100px; }
        .tag-blue { background: #dde8ff; color: #1b4fd1; }
        .tag-orange { background: #ffe4d1; color: #c1541a; }
        .tag-green { background: #e3f7ec; color: #1f8a4c; }
        .bar-chart { display: flex; align-items: flex-end; gap: 10px; height: 150px; padding-top: 10px; }
        .bar-column { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .bar-track { width: 100%; height: 120px; display: flex; align-items: flex-end; background: #f7f9fc; border-radius: 6px; overflow: hidden; }
        .bar-fill { width: 100%; height: 0%; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, #2f6fed, #1b4fd1); transition: height 1.4s cubic-bezier(0.2,0.8,0.2,1); }
        .bar-column:nth-child(even) .bar-fill { background: linear-gradient(180deg, #ff7a2f, #c1541a); }
        .bar-column span { font-size: 10.5px; color: #5b6172; font-weight: 600; }
        .donut-wrapper { display: flex; align-items: center; gap: 18px; }
        .donut { width: 120px; height: 120px; flex-shrink: 0; }
        .donut circle { fill: none; stroke-width: 14; }
        .donut-background { stroke: #f7f9fc; }
        .segment { stroke-dasharray: 0 999; transition: stroke-dasharray 1.4s cubic-bezier(0.2,0.8,0.2,1); }
        .legend { display: flex; flex-direction: column; gap: 9px; width: 100%; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
        .legend-color { width: 9px; height: 9px; border-radius: 2px; }
        .legend-value { margin-left: auto; font-weight: 700; font-size: 11.5px; color: #5b6172; }
        .line-chart { width: 100%; height: 150px; }
        .line-area { fill: url(#lineFill); opacity: 0; transition: opacity 1s ease 0.3s; }
        .chart-card.in .line-area { opacity: 1; }
        .line { fill: none; stroke: #ff7a2f; stroke-width: 2.5; stroke-dasharray: 400; stroke-dashoffset: 400; transition: stroke-dashoffset 1.6s cubic-bezier(0.2,0.8,0.2,1); }
        .chart-card.in .line { stroke-dashoffset: 0; }
        .line-point { fill: #ff7a2f; opacity: 0; transition: opacity 0.4s ease 1.2s; }
        .chart-card.in .line-point { opacity: 1; }

        .features { padding: 20px 5vw 64px; }
        .feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .feature-card { background: white; border: 1px solid #e7ebf3; border-radius: 16px; padding: 20px; transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -20px rgba(16,20,37,0.25); border-color: transparent; }
        .feature-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; font-size: 17px; }
        .feature-card:nth-child(odd) .feature-icon { background: #dde8ff; color: #1b4fd1; }
        .feature-card:nth-child(even) .feature-icon { background: #ffe4d1; color: #c1541a; }
        .feature-card h3 { font-size: 15px; font-weight: 600; margin-bottom: 5px; }
        .feature-card p { font-size: 13px; color: #5b6172; line-height: 1.5; }

        footer { margin: 0 5vw 40px; padding: 42px 5vw; border-radius: 24px;
          background: linear-gradient(120deg, #2f6fed 0%, #1b4fd1 55%, #16357a 100%);
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; overflow: hidden; position: relative; }
        footer::after { content: ""; position: absolute; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,122,47,0.5), transparent 70%);
          right: -100px; top: -140px; animation: drift 8s ease-in-out infinite; }
        @keyframes drift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-30px,20px); } }
        footer h2 { color: white; font-size: clamp(22px, 2.6vw, 28px); font-weight: 700; max-width: 440px; position: relative; z-index: 1; }
        footer p { color: #dbe7ff; font-size: 13.5px; margin-top: 8px; position: relative; z-index: 1; }
        footer .btn-primary { background: white; color: #1b4fd1; position: relative; z-index: 1; }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }

        @media (max-width: 980px) {
          .hero { grid-template-columns: 1fr; min-height: auto; padding-top: 6px; }
          .stage { height: 400px; margin-top: 16px; }
          .portal-grid { grid-template-columns: 1fr; }
          .stat-strip { grid-template-columns: repeat(2, 1fr); }
          .chart-grid { grid-template-columns: 1fr; }
          .counter-row { grid-template-columns: repeat(2, 1fr); }
          .feature-grid { grid-template-columns: repeat(2, 1fr); }
          .nav-links { display: none; }
        }
        @media (max-width: 600px) {
          nav { padding: 16px 20px; }
          .hero { padding: 25px 20px 40px; }
          .headline { font-size: 38px; }
          .stage { height: 350px; }
          .candidate-card { left: -5px; bottom: -10px; }
          .attendance-card { right: -5px; }
          .stat-strip { grid-template-columns: 1fr; }
          .stat-cell { border-right: none; border-bottom: 1px solid #e7ebf3; }
          .counter-row { grid-template-columns: 1fr; }
          .feature-grid { grid-template-columns: 1fr; }
          .portal-grid { grid-template-columns: 1fr; }
          .donut-wrapper { flex-direction: column; align-items: flex-start; }
          footer { margin: 0 20px 30px; padding: 30px 25px; }
        }
      `}</style>

      {/* BACKGROUND */}
      <div className="bg-flow">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="flowGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2f6fed" />
              <stop offset="100%" stopColor="#ff7a2f" />
            </linearGradient>
          </defs>
          <path className="flow-path" d="M -100 620 C 200 500, 350 750, 600 600 S 1000 420, 1250 560 S 1500 700, 1700 550" />
          <path className="flow-path" style={{ animationDuration: "24s", opacity: 0.18 }} d="M -100 220 C 250 120, 400 320, 650 220 S 1050 60, 1300 200 S 1600 340, 1800 200" />
        </svg>
      </div>

      <div ref={appRef}>
        {/* NAV */}
        <nav>
          <div className="logo">
            <span className="logo-dot"></span>
            Dayflow
          </div>
          <div className="nav-links">
            <a href="#portals">Portals</a>
            <a href="#analytics">Insights</a>
            <a href="#features">Modules</a>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Get started</button>
          </div>
        </nav>

        {/* HERO */}
        <header className="hero">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-bar"></span>
              HR MANAGEMENT SYSTEM
            </div>
            <h1 className="headline">
              Every workday,<br />
              <span className="headline-accent">perfectly aligned.</span>
            </h1>
            <p className="subtitle">
              Dayflow gives HR, candidates and admins their own view of the same source of truth —
              attendance, leave, payroll and hiring, always in sync.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Open admin portal</button>
              <button className="btn btn-ghost" onClick={() => navigate('/login')}>Employee login</button>
            </div>
            <div className="portal-chips">
              <div className="chip"><span className="chip-dot chip-blue"></span>HR Portal</div>
              <div className="chip"><span className="chip-dot chip-orange"></span>Candidate Portal</div>
              <div className="chip"><span className="chip-dot chip-green"></span>Admin Portal</div>
            </div>
          </div>

          {/* HERO DASHBOARD MOCKUP */}
          <div className="stage">
            <div className="card main-card">
              <div className="main-top">
                <div className="main-title">Company overview</div>
                <div className="live-pill">Live</div>
              </div>
              <div className="tile-grid">
                <div className="tile">
                  <div className="tile-label">Attendance</div>
                  <div className="tile-value tile-blue">94.2%</div>
                  <div className="tile-delta">↑ 2.1% wow</div>
                </div>
                <div className="tile">
                  <div className="tile-label">Open roles</div>
                  <div className="tile-value tile-orange">12</div>
                  <div className="tile-delta">3 closing this week</div>
                </div>
                <div className="tile">
                  <div className="tile-label">Pending leaves</div>
                  <div className="tile-value tile-blue">5</div>
                  <div className="tile-delta" style={{ color: "#c1541a" }}>Needs review</div>
                </div>
                <div className="tile">
                  <div className="tile-label">Payroll status</div>
                  <div className="tile-value tile-orange">On track</div>
                  <div className="tile-delta">Runs in 4 days</div>
                </div>
              </div>
              <svg className="spark" viewBox="0 0 300 56" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f6fed" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2f6fed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="spark-fill" d="M0,40 L25,32 L50,38 L75,20 L100,28 L125,14 L150,24 L175,10 L200,18 L225,8 L250,16 L275,6 L300,12 L300,56 L0,56 Z" />
                <path className="spark-line" d="M0,40 L25,32 L50,38 L75,20 L100,28 L125,14 L150,24 L175,10 L200,18 L225,8 L250,16 L275,6 L300,12" />
                <circle className="spark-dot" cx="300" cy="12" r="4" />
              </svg>
            </div>

            {/* Attendance floating card */}
            <div className="card floating-card attendance-card">
              <div className="ring-wrapper">
                <div className="ring">
                  <svg width="46" height="46">
                    <circle className="ring-track" cx="23" cy="23" r="21" />
                    <circle className="ring-progress" cx="23" cy="23" r="21" />
                  </svg>
                </div>
                <div>
                  <div className="ring-number">92%</div>
                  <div className="ring-label">Present</div>
                </div>
              </div>
            </div>

            {/* Candidate card */}
            <div className="card floating-card candidate-card">
              <div className="candidate-title">Candidate pipeline</div>
              <div className="status-row"><span className="status-dot approved"></span>Interview stage<span className="status-number">08</span></div>
              <div className="status-row"><span className="status-dot pending"></span>Offer pending<span className="status-number">03</span></div>
              <div className="status-row"><span className="status-dot approved"></span>Onboarding<span className="status-number">02</span></div>
            </div>
          </div>
        </header>

        {/* PORTALS */}
        <section className="portals" id="portals">
          <div className="section-header reveal">
            <h2>Three portals. One system of record.</h2>
            <p>Every role gets exactly the surface it needs — nothing borrowed, nothing bolted on.</p>
          </div>
          <div className="portal-grid">
            <div className="portal-card hr-card reveal">
              <div className="portal-icon">👥</div>
              <h3>HR Portal</h3>
              <p className="portal-description">The day-to-day control room for HR officers — approvals, records and reports in one place.</p>
              <ul>
                <li>Review & approve leave requests</li>
                <li>Manage employee records</li>
                <li>Run attendance & payroll reports</li>
              </ul>
              <div className="portal-link" onClick={() => navigate('/login')}>Enter HR portal <span className="arrow">→</span></div>
            </div>
            <div className="portal-card candidate-portal reveal">
              <div className="portal-icon">🎯</div>
              <h3>Candidate Portal</h3>
              <p className="portal-description">A clear, guided space for applicants — from application to offer to their first day.</p>
              <ul>
                <li>Track application status live</li>
                <li>Upload documents securely</li>
                <li>Schedule interviews & onboarding</li>
              </ul>
              <div className="portal-link">Enter candidate portal <span className="arrow">→</span></div>
            </div>
            <div className="portal-card admin-portal reveal">
              <div className="portal-icon">🛡️</div>
              <h3>Admin Portal</h3>
              <p className="portal-description">Full system oversight — roles, permissions, payroll structure and company-wide analytics.</p>
              <ul>
                <li>Configure roles & permissions</li>
                <li>Control salary structures</li>
                <li>View enterprise-wide analytics</li>
              </ul>
              <div className="portal-link" onClick={() => navigate('/login')}>Enter admin portal <span className="arrow">→</span></div>
            </div>
          </div>
        </section>

        {/* STAT STRIP */}
        <section className="stat-strip">
          <div className="stat-cell"><div className="stat-number">3 <span className="stat-accent">portals</span></div><div className="stat-label">HR · Candidate · Admin</div></div>
          <div className="stat-cell"><div className="stat-number">128 <span className="stat-accent">employees</span></div><div className="stat-label">Synced in real time</div></div>
          <div className="stat-cell"><div className="stat-number">94.2% <span className="stat-accent">attendance</span></div><div className="stat-label">Company-wide, this week</div></div>
          <div className="stat-cell"><div className="stat-number">&lt; 2m <span className="stat-accent">avg.</span></div><div className="stat-label">Leave approval time</div></div>
        </section>

        {/* ANALYTICS */}
        <section className="analytics" id="analytics">
          <div className="section-header reveal">
            <h2>Built for enterprise-scale visibility.</h2>
            <p>The same numbers your leadership team sees every Monday morning.</p>
          </div>
          <div className="counter-row reveal">
            <div className="counter-card"><div className="counter-number" data-target="128">0</div><div className="counter-label">Active employees</div></div>
            <div className="counter-card"><div className="counter-number" data-target="41">0</div><div className="counter-label">Candidates in pipeline</div></div>
            <div className="counter-card"><div className="counter-number" data-target="99">0</div><div className="counter-label">Payroll accuracy %</div></div>
            <div className="counter-card"><div className="counter-number" data-target="12">0</div><div className="counter-label">Departments tracked</div></div>
          </div>
          <div className="chart-grid">
            <div className="chart-card reveal" id="barCard">
              <div className="chart-header"><div className="chart-title">Attendance by department</div><div className="chart-tag tag-blue">This week</div></div>
              <div className="bar-chart">
                {[["ENG", 88], ["SALES", 95], ["OPS", 79], ["HR", 91], ["FIN", 85], ["SUPP", 97]].map(([name, value]) => (
                  <div className="bar-column" key={name}>
                    <div className="bar-track"><div className="bar-fill" data-height={value} /></div>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-card reveal" id="donutCard">
              <div className="chart-header"><div className="chart-title">Leave type breakdown</div><div className="chart-tag tag-orange">30 days</div></div>
              <div className="donut-wrapper">
                <svg className="donut" viewBox="0 0 120 120">
                  <circle className="donut-background" cx="60" cy="60" r="45" />
                  <circle className="segment" cx="60" cy="60" r="45" stroke="#2f6fed" transform="rotate(-90 60 60)" data-percentage="45" />
                  <circle className="segment" cx="60" cy="60" r="45" stroke="#ff7a2f" transform="rotate(-90 60 60)" data-percentage="30" data-offset="45" />
                  <circle className="segment" cx="60" cy="60" r="45" stroke="#2fbf6d" transform="rotate(-90 60 60)" data-percentage="25" data-offset="75" />
                </svg>
                <div className="legend">
                  <div className="legend-item"><span className="legend-color" style={{ background: "#2f6fed" }} />Paid leave<span className="legend-value">45%</span></div>
                  <div className="legend-item"><span className="legend-color" style={{ background: "#ff7a2f" }} />Sick leave<span className="legend-value">30%</span></div>
                  <div className="legend-item"><span className="legend-color" style={{ background: "#2fbf6d" }} />Unpaid<span className="legend-value">25%</span></div>
                </div>
              </div>
            </div>
            <div className="chart-card reveal" id="lineCard">
              <div className="chart-header"><div className="chart-title">Hiring pipeline</div><div className="chart-tag tag-green">6 months</div></div>
              <svg className="line-chart" viewBox="0 0 220 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a2f" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ff7a2f" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="line-area" d="M0,120 L36,100 L72,108 L108,70 L144,80 L180,40 L220,52 L220,150 L0,150 Z" />
                <path className="line" d="M0,120 L36,100 L72,108 L108,70 L144,80 L180,40 L220,52" />
                <circle className="line-point" cx="220" cy="52" r="4" />
              </svg>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features" id="features">
          <div className="section-header reveal">
            <h2>One system, every HR module.</h2>
            <p>The same four building blocks, viewed differently by every portal.</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card reveal"><div className="feature-icon">◧</div><h3>Attendance tracking</h3><p>Daily check-in/out with present, absent, half-day and leave states, by day or week.</p></div>
            <div className="feature-card reveal"><div className="feature-icon">◔</div><h3>Leave & time-off</h3><p>Apply with a date range and remark; HR approves, rejects or comments in one click.</p></div>
            <div className="feature-card reveal"><div className="feature-icon">▤</div><h3>Payroll visibility</h3><p>Read-only salary view for employees; full structure control for admins.</p></div>
            <div className="feature-card reveal"><div className="feature-icon">◈</div><h3>Profiles & documents</h3><p>Personal, job and document details — employees edit contact info, admins edit all.</p></div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div>
            <h2>Bring HR, hiring and admin into one flow.</h2>
            <p>Secure sign-up, role-based portals, and approvals that update in real time.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Create admin account →</button>
        </footer>
      </div>
    </>
  );
}
