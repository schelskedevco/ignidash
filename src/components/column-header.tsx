interface ColumnHeaderProps {
  title: string | React.ReactNode;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  iconButton: React.ReactNode;
}

export default function ColumnHeader({ title, icon: Icon, iconButton }: ColumnHeaderProps) {
  return (
    <div className="border-border mb-5 border-b pb-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Icon className="text-primary h-8 w-8" aria-hidden="true" />
          {title}
        </h2>
        {iconButton}
      </div>
    </div>
  );
}
