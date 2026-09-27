"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { LayoutPublic } from '@/components/layout/layout-public';
import { LandingHero } from '@/features/landing/landing-hero';
import { LandingProof } from '@/features/landing/landing-proof';
import { LandingCost } from '@/features/landing/landing-cost';
import { LandingSegments } from '@/features/landing/landing-segments';
import { LandingFeatures } from '@/features/landing/landing-features';
import { LandingAI } from '@/features/landing/landing-ai';
import { LandingCompare } from '@/features/landing/landing-compare';
import { LandingPricingTeaser } from '@/features/landing/landing-pricing-teaser';
import { LandingFAQ } from '@/features/landing/landing-faq';
import { LandingFinalCTA } from '@/features/landing/landing-final-cta';

export function Landing({ plans, trialDays }) {
  const navigate = useNavigate();
  return (
    <LayoutPublic navigate={navigate} route="/">
      <LandingHero navigate={navigate} trialDays={trialDays} />
      <LandingProof />
      <LandingCost navigate={navigate} />
      <LandingSegments />
      <LandingFeatures navigate={navigate} />
      <LandingAI navigate={navigate} />
      <LandingCompare navigate={navigate} />
      <LandingPricingTeaser navigate={navigate} plans={plans} />
      <LandingFAQ />
      <LandingFinalCTA navigate={navigate} trialDays={trialDays} />
    </LayoutPublic>
  );
}
