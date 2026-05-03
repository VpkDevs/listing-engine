import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import ListingGenerator from "@/pages/ListingGenerator";
import BulkOptimizer from "@/pages/BulkOptimizer";
import PricingCalculator from "@/pages/PricingCalculator";
import KeywordResearch from "@/pages/KeywordResearch";
import TemplatesLibrary from "@/pages/TemplatesLibrary";
import ProfitTracker from "@/pages/ProfitTracker";
import ConditionHelper from "@/pages/ConditionHelper";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ListingGenerator} />
        <Route path="/bulk-optimizer" component={BulkOptimizer} />
        <Route path="/pricing" component={PricingCalculator} />
        <Route path="/keywords" component={KeywordResearch} />
        <Route path="/templates" component={TemplatesLibrary} />
        <Route path="/tracker" component={ProfitTracker} />
        <Route path="/condition" component={ConditionHelper} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
