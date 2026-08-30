import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("terms");

export const generateMetadata = route.generateMetadata;
export default route.Page;
