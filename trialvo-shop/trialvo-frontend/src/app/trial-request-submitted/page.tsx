import { Suspense } from "react";
import TrialRequestSubmittedPage from "@/views/TrialRequestSubmittedPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TrialRequestSubmittedPage />
    </Suspense>
  );
}
