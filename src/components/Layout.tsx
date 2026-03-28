import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompactSiteStream from "@/components/CompactSiteStream";
import { useIsCompactNav } from "@/hooks/use-compact-nav";
import { trackEvent } from "@/lib/cmsApi";

const navbarOffset = 116;

export default function Layout() {
  const location = useLocation();
  const isCompactNav = useIsCompactNav();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    let frame = 0;
    let attempts = 0;

    const scrollToHashTarget = () => {
      const targetId = location.hash.replace("#", "");
      const target = document.getElementById(targetId);

      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }

      if (attempts < 12) {
        attempts += 1;
        frame = window.requestAnimationFrame(scrollToHashTarget);
      }
    };

    frame = window.requestAnimationFrame(scrollToHashTarget);
    return () => window.cancelAnimationFrame(frame);
  }, [isCompactNav, location.pathname, location.hash]);

  useEffect(() => {
    const updateProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  // Auto-advance navigation based on scrolling was removed to prevent
  // unexpected “scroll back to top” behavior when reaching the bottom of a page.
  // The page will now behave like a normal scroll container.

  useEffect(() => {
    trackEvent({
      eventType: "page_view",
      page: `${location.pathname}${location.search}${location.hash}`,
      metadata: {
        compact: isCompactNav,
      },
    }).catch(() => {
      // Keep navigation resilient if analytics tracking is unavailable.
    });
  }, [isCompactNav, location.hash, location.pathname, location.search]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(29,157,240,0.18),transparent_58%)]" />
        <div className="absolute -left-16 top-[22rem] h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-12 top-[56rem] h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-accent via-gold to-secondary transition-[width] duration-150"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <Navbar />
      <main key={`${location.pathname}${location.hash}`} className="page-transition flex-1">
        <Outlet />
        {isCompactNav && location.pathname === "/" && <CompactSiteStream />}
      </main>
      <Footer />
    </div>
  );
}

