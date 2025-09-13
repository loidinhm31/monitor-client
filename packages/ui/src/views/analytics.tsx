import TabbedAnalytics from "@repo/ui/components/templates/analytic-stocks/tabbed-analytics";

export default function AnalyticsPage() {
  return (
    <section className="py-8 md:py-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Stock Market Analytics</h1>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            Comprehensive stock analysis tools with technical indicators and portfolio tracking.
          </p>
        </div>
        <TabbedAnalytics />
      </div>
    </section>
  );
}
