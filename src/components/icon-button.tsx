interface IconButtonProps {
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
}

export function IconButton({ icon: Icon, label }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="focus-visible:outline-foreground rounded-full p-2 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 hover:dark:bg-zinc-900"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
