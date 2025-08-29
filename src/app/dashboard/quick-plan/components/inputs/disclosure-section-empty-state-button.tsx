interface DisclosureSectionEmptyStateButtonProps {
  onClick: () => void;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  buttonText: string;
}

export default function DisclosureSectionEmptyStateButton({ onClick, icon: Icon, buttonText }: DisclosureSectionEmptyStateButtonProps) {
  return (
    <button
      type="button"
      className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-stone-300 p-4 text-center hover:border-stone-400 dark:border-white/15 dark:hover:border-white/25"
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="text-primary mx-auto size-12" />
      <span className="mt-2 block text-sm font-semibold text-stone-900 dark:text-white">{buttonText}</span>
    </button>
  );
}
