interface AppLogoProps {
  className?: string;
}

export default function AppLogo({ className }: AppLogoProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="Ignidash logo" className={className} />;
}
