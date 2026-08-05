"use client";

import dynamic from "next/dynamic";

const LanguageSelectModal = dynamic(
 () => import("./LanguageSelectModal"),
 { ssr: false }
);

export default function LanguageSelectModalLoader() {
 return <LanguageSelectModal />;
}
