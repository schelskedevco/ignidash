interface MainAreaProps {
  children?: React.ReactNode;
}

export default function MainArea({ children }: MainAreaProps) {
  return (
    <main className="lg:pl-72 xl:fixed xl:inset-0 xl:left-96 xl:overflow-y-auto">
      <div className="@container">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </div>
    </main>
  );
}
