interface SecondaryColumnProps {
  children?: React.ReactNode;
}

export function SecondaryColumn({ children }: SecondaryColumnProps) {
  return (
    <aside className="border-border fixed inset-y-0 left-72 hidden w-96 overflow-y-auto border-r px-4 py-6 sm:px-6 lg:px-8 xl:block">
      {children}
    </aside>
  );
}
