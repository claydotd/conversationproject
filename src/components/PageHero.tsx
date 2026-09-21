interface PageHeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
}

export function PageHero({ eyebrow, heading, subheading }: PageHeroProps) {
  return (
    <section className="hero page">
      {eyebrow ? <p className="hero__eyebrow">{eyebrow}</p> : null}
      {heading ? <h1>{heading}</h1> : null}
      {subheading ? <p className="hero__sub">{subheading}</p> : null}
    </section>
  );
}
