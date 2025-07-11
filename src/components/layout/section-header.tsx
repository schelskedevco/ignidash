interface SectionHeaderProps {
  title?: string | React.ReactNode;
  desc?: string | React.ReactNode;
}

export function SectionHeader({ title, desc }: SectionHeaderProps) {
  return (
    (title || desc) && (
      <div className="ml-2">
        {title && <h4 className="text-base font-semibold">{title}</h4>}
        {desc && <p className="text-muted-foreground text-sm">{desc}</p>}
      </div>
    )
  );
}
