import { PROJECT_NEED_TYPES, PROJECT_NEED_TYPE_LABELS } from "@/src/lib/project-needs";
import { NeedCard, type ProjectNeedView } from "@/components/projects/NeedCard";

type NeedsSectionProps = {
  needs: ProjectNeedView[];
  formatMoney: (amount?: number | null) => string;
};

export function NeedsSection({ needs, formatMoney }: NeedsSectionProps) {
  if (needs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-secondary">
        Aucun besoin n&apos;est encore publié pour ce projet.
      </div>
    );
  }

  const orderedNeeds = [...needs].sort(
    (leftNeed, rightNeed) => Number(leftNeed.isFilled) - Number(rightNeed.isFilled)
  );

  return (
    <div className="space-y-5">
      {PROJECT_NEED_TYPES.map((type) => {
        const group = orderedNeeds.filter((need) => need.type === type);
        if (group.length === 0) {
          return null;
        }

        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                {PROJECT_NEED_TYPE_LABELS[type]}
              </h3>
              <span className="text-xs text-text-secondary">{group.length}</span>
            </div>
            <div className="space-y-3">
              {group.map((need) => (
                <NeedCard key={need.id} need={need} formatMoney={formatMoney} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default NeedsSection;

