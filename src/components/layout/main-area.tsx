interface MainAreaProps {
  children?: React.ReactNode;
}

export default function MainArea({ children }: MainAreaProps) {
  return (
    <main className="lg:pl-72 group-data-[state=collapsed]/sidebar:lg:pl-16 xl:fixed xl:inset-0 xl:left-96 xl:overflow-y-auto group-data-[state=collapsed]/sidebar:xl:left-152">
      <div className="@container">
        <div className="px-2 sm:px-3 lg:px-4">{children}</div>
      </div>
    </main>
  );
}
