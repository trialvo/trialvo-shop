import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("disclaimer");

export const generateMetadata = route.generateMetadata;
export default route.Page;
