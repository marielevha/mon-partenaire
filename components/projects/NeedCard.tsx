import { projectNeedTypeLabel } from "@/src/lib/project-needs";
import { NeedApplicationForm } from "@/components/projects/NeedApplicationForm";

export type ProjectNeedView = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  amount: number | null;
  requiredCount: number | null;
  equityPercent: number | null;
  skillTags: string[];
  isFilled: boolean;
};

type NeedCardProps = {
  need: ProjectNeedView;
  formatMoney: (amount?: number | null) => string;
  projectId: string;
  isAuthenticated: boolean;
  isProjectOwner: boolean;
  existingApplicationStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
};

export function NeedCard({
  need,
  formatMoney,
  projectId,
  isAuthenticated,
  isProjectOwner,
  existingApplicationStatus,
}: NeedCardProps) {
  const typeLabel = projectNeedTypeLabel(need.type);

  return (
    <div className="rounded-lg border border-border/50 bg-background/60 p-4 transition-colors hover:bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">{need.title}</p>
            <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {typeLabel}
            </span>
            {need.isFilled ? (
              <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                Comblé
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                Ouvert
              </span>
            )}
          </div>

          {need.description ? (
            <p className="text-sm text-text-secondary">{need.description}</p>
          ) : null}

          {need.skillTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {need.skillTags.map((tag) => (
                <span
                  key={`${need.id}-${tag}`}
                  className="inline-flex items-center rounded-full bg-surface-accent px-2.5 py-1 text-xs text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="text-right text-sm">
          {need.type === "FINANCIAL" ? (
            <p className="font-semibold text-text-primary">{formatMoney(need.amount)}</p>
          ) : need.type === "SKILL" && need.requiredCount ? (
            <p className="font-semibold text-text-primary">{need.requiredCount} profil(s)</p>
          ) : null}

          {typeof need.requiredCount === "number" && need.type === "FINANCIAL" ? (
            <p className="mt-1 text-xs text-text-secondary">
              Quantité: {need.requiredCount}
            </p>
          ) : null}

          {typeof need.equityPercent === "number" ? (
            <p className="mt-1 text-xs text-text-secondary">
              Jusqu&apos;à {need.equityPercent}%
            </p>
          ) : null}
        </div>
      </div>

      <NeedApplicationForm
        projectId={projectId}
        projectNeedId={need.id}
        needType={need.type}
        needTitle={need.title}
        ownerDefinedEquityPercent={need.equityPercent ?? null}
        ownerDefinedRequiredCount={need.requiredCount ?? null}
        isNeedFilled={need.isFilled}
        isAuthenticated={isAuthenticated}
        isProjectOwner={isProjectOwner}
        existingStatus={existingApplicationStatus}
      />
    </div>
  );
}

export default NeedCard;
