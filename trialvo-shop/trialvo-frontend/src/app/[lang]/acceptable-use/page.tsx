import { createLegalRoute } from "@/lib/seo/legalRoute";

const route = createLegalRoute("acceptableUse");

export const generateMetadata = route.generateMetadata;
export default route.Page;
