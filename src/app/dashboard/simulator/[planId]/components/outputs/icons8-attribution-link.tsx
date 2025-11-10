export default function Icons8AttributionLink() {
  // Attribution text from Icons8:
  // <a target="_blank" href="https://icons8.com/icon/31138/investment-portfolio">Investment Portfolio</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>

  return (
    <small className="text-muted-foreground decoration-muted-foreground block py-4 text-center text-xs">
      <a
        target="_blank"
        href="https://icons8.com/icon/31138/investment-portfolio"
        rel="noopener noreferrer"
        className="hover:text-foreground hover:decoration-foreground underline transition-colors"
      >
        Investment Portfolio
      </a>
      {' icon by '}
      <a
        target="_blank"
        href="https://icons8.com"
        rel="noopener noreferrer"
        className="hover:text-foreground hover:decoration-foreground underline transition-colors"
      >
        Icons8
      </a>
    </small>
  );
}
