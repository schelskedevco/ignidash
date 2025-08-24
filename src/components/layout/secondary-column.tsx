interface SecondaryColumnProps {
  children?: React.ReactNode;
}

export default function SecondaryColumn({ children }: SecondaryColumnProps) {
  return (
    <aside className="border-border fixed inset-y-0 left-72 hidden w-96 overflow-y-auto border-r px-2 group-data-[state=collapsed]/sidebar:left-16 group-data-[state=collapsed]/sidebar:w-152 sm:px-3 lg:px-4 xl:block">
      {children}
    </aside>
  );
}
