import Globe3D from "./3dglobe";
import CongestedPricing from "./congested-pricing";
import CircularFeaturesSection from "./features";
import FeaturesSectionDemo from "./features-section-demo-3";
import Footer4Col from "./footer-4col";

export default function LandingPage() {
  return (
    <>
      <Globe3D />

      <div className="bg-[#130101]">
        <FeaturesSectionDemo />
      </div>

      <div className="bg-[#130101] pb-16">
        <CircularFeaturesSection />
      </div>

      <div className="bg-[#130101] pb-16">
        <CongestedPricing />
      </div>

      <Footer4Col />
    </>
  );
}
