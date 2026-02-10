"use client";

import React from "react";

export function ProjectFilters({ categories }: { categories: string[] }) {
  return (
    <form method="get" action="/projects" className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-text-secondary mb-1">Catégorie</label>
        <select name="category" defaultValue="" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-text-secondary mb-1">Type de besoin</label>
        <select name="needType" defaultValue="" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
          <option value="">Tous types</option>
          <option value="FINANCIAL">Financier</option>
          <option value="SKILL">Compétence</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-text-secondary mb-1">Ville</label>
        <input name="city" placeholder="Ex: Brazzaville" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </div>

      <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong">
        Filtrer
      </button>
    </form>
  );
}

export default ProjectFilters;
