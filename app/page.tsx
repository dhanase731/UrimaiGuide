import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Workflow } from "@/components/workflow"
import { Mission } from "@/components/mission"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div id="top" className="min-h-screen bg-parchment">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <Workflow />
        <Mission />
      </main>
      <SiteFooter />
    </div>
  )
}
