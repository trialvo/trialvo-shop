import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("refund");

export const generateMetadata = route.generateMetadata;
export default route.Page;
