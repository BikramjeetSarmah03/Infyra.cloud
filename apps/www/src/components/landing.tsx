import FeaturesSectionDemo from "./features-section-demo-3";
import Globe3D from "./mvpblocks/3dglobe";
import Footer4Col from "./mvpblocks/footer-4col";

export default function LandingPage() {
  return (
    <>
      <Globe3D />

      <FeaturesSectionDemo />

      <Footer4Col />
    </>
  );
}
// <main className="relative flex justify-center items-center w-full xl:h-screen min-h-screen overflow-hidden">
//   <Spotlight />

//   <Particles
//     className="z-0 absolute inset-0"
//     quantity={100}
//     ease={80}
//     refresh
//     color={color}
//   />

//   <div className="z-[100] relative mx-auto px-4 py-16 text-center">
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="space-y-4"
//     >
//       <h1 className="font-semibold text-3xl md:text-5xl">
//         Deploy Anywhere. Scale Everywhere
//       </h1>

//       <h3 className="text-lg">
//         One dashboard for AWS, GCP, Azure, Oracle — with India-first pricing
//         and developer-first simplicity.
//       </h3>
//     </motion.div>
//   </div>
// </main>
