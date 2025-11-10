interface PageLoadingProps {
  message: string;
  ariaLabel?: string;
}

export default function PageLoading({ message, ariaLabel }: PageLoadingProps) {
  return (
    <div role="status" aria-label={ariaLabel} className="text-muted-foreground flex h-full items-center justify-center text-2xl sm:text-xl">
      {message}
      <span className="loading-ellipsis" aria-hidden="true" />
    </div>
  );
}
