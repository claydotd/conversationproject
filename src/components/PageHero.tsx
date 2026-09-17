interface PageHeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
}

export function PageHero({ eyebrow, heading, subheading }: PageHeroProps) {
  return (
    <section className="hero page">
      <p className="hero__eyebrow">{eyebrow}</p>
      <h1>{heading}</h1>
      {subheading ? <p className="hero__sub">{subheading}</p> : null}
    </section>
  );
}
