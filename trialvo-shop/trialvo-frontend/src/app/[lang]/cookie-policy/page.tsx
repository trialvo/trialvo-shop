import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("cookies");

export const generateMetadata = route.generateMetadata;
export default route.Page;
