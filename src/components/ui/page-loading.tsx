interface PageLoadingProps {
  message: string;
}

export default function PageLoading({ message }: PageLoadingProps) {
  return (
    <div role="status" aria-label={message} className="text-muted-foreground flex h-full items-center justify-center text-2xl sm:text-xl">
      {message}
      <span className="loading-ellipsis" aria-hidden="true" />
    </div>
  );
}
