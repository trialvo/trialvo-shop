import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("license");

export const generateMetadata = route.generateMetadata;
export default route.Page;
