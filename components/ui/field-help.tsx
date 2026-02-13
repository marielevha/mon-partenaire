type FieldHelpProps = {
  text: string;
  className?: string;
};

export function FieldHelp({ text, className }: FieldHelpProps) {
  return (
    <span
      title={text}
      aria-label={text}
      className={[
        "inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold text-text-secondary",
        "cursor-help select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      ?
    </span>
  );
}

export default FieldHelp;
