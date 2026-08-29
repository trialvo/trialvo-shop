import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("support");

export const generateMetadata = route.generateMetadata;
export default route.Page;
