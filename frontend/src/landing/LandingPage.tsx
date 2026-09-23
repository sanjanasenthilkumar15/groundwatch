import { useEffect } from 'react'
import './landing.css'

import { LandingThemeProvider, useLandingTheme } from './theme'
import LandingNav from './LandingNav'
import Hero from './Hero'
import SectionProblem from './SectionProblem'
import SectionPipeline from './SectionPipeline'
import SectionSources from './SectionSources'
import SectionForecast from './SectionForecast'
import SectionRisk from './SectionRisk'
import SectionFarmer from './SectionFarmer'
import SectionPlatform from './SectionPlatform'
import SectionFuture from './SectionFuture'
import SectionCTA from './SectionCTA'

/* ===========================================================================
   Public landing page.

   Fully self-contained: every style lives under `.gwl` (landing.css) and this
   page renders outside the authenticated shell, so the officer console's
   theme, routing and auth are untouched. Its own light/dark toggle (light by
   default) is scoped to this page via LandingThemeProvider/theme.tsx and
   stamped as data-theme on the `.gwl` div itself — never on <html> — so it
   can't collide with the authenticated app's separate ThemeContext.
   =========================================================================== */

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <LandingPageBody />
    </LandingThemeProvider>
  )
}

const BODY_BG = { light: '#F6F9F8', dark: '#04070A' }

function LandingPageBody() {
  const { theme } = useLandingTheme()

  /* The app body is themed by ThemeContext independently of this page.
     Paint the document behind it to match while this page is mounted (so
     there's no flash of the app's own background at the scroll edges),
     then restore whatever was there on unmount. */
  useEffect(() => {
    const body = document.body
    const html = document.documentElement
    const prevBody = body.style.backgroundColor
    const prevScroll = html.style.scrollBehavior

    body.style.backgroundColor = BODY_BG[theme]
    html.style.scrollBehavior = 'smooth'

    return () => {
      body.style.backgroundColor = prevBody
      html.style.scrollBehavior = prevScroll
    }
  }, [theme])

  return (
    <div className="gwl" data-theme={theme}>
      <a
        href="#platform"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] gwl-btn gwl-btn--ghost gwl-btn--sm"
      >
        Skip to platform overview
      </a>

      <LandingNav />

      <main>
        <Hero />
        <SectionProblem />
        <SectionPipeline />
        <SectionSources />
        <SectionForecast />
        <SectionRisk />
        <SectionFarmer />
        <SectionPlatform />
        <SectionFuture />
        <SectionCTA />
      </main>
    </div>
  )
}
