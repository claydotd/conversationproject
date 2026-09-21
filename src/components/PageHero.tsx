interface PageHeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  className?: string;
}

export function PageHero({
  eyebrow,
  heading,
  subheading,
  className,
}: PageHeroProps) {
  return (
    <section className={["hero", className].filter(Boolean).join(" ")}>
      <div className="page">
        {eyebrow ? <p className="hero__eyebrow">{eyebrow}</p> : null}
        {heading ? <h1>{heading}</h1> : null}
        {subheading ? <p className="hero__sub">{subheading}</p> : null}
      </div>
    </section>
  );
}
