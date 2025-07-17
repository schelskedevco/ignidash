interface SectionHeaderProps {
  title: string | React.ReactNode;
  desc: string | React.ReactNode;
}

export default function SectionHeader({ title, desc }: SectionHeaderProps) {
  return (
    <div className="ml-2">
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 text-base">{desc}</p>
    </div>
  );
}
