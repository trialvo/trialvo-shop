"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CatalogSearch } from "./CatalogSearch";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";

/**
 * Query-string-bound wrapper around the search input. Split out so the URL read
 * stays inside a Suspense boundary and does not opt the whole page out of
 * prerendering.
 */
export function CatalogSearchBar({ className }: Readonly<{ className?: string }>) {
  const { query, setQuery, clearSearch } = useCatalogFilters();
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(draft);
  };

  const handleClear = () => {
    setDraft("");
    clearSearch();
  };

  return (
    <CatalogSearch
      value={draft}
      onChange={setDraft}
      onSubmit={handleSubmit}
      onClear={handleClear}
      className={className}
    />
  );
}

export default CatalogSearchBar;
