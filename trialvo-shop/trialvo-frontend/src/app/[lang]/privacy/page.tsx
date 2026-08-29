import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("privacy");

export const generateMetadata = route.generateMetadata;
export default route.Page;
