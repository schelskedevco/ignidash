interface ColumnHeaderProps {
  title: string | React.ReactNode;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  iconButton: React.ReactNode;
}

export default function ColumnHeader({ title, icon: Icon, iconButton }: ColumnHeaderProps) {
  return (
    <div className="border-border bg-emphasized-background -mx-2 border-b py-4 font-mono shadow-xs sm:-mx-3 lg:-mx-4 dark:shadow-black/30">
      <div className="mx-4 flex items-center justify-between sm:mx-6 lg:mx-8">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight uppercase">
          <Icon className="text-primary h-8 w-8" aria-hidden="true" />
          {title}
        </h2>
        {iconButton}
      </div>
    </div>
  );
}
