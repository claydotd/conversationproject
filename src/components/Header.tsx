import { useState } from "react";
import { NavLink } from "react-router-dom";
import { TrolleyIcon } from "../icons/TrolleyIcon";
import { useCart } from "../lib/cart-context";
import { useSiteContent } from "../lib/content-context";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { content } = useSiteContent();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-header__inner">
        <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand__name">{content.site.name}</span>
          {content.site.tagline ? (
            <span className="brand__tagline">{content.site.tagline}</span>
          ) : null}
        </NavLink>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav
          id="site-nav"
          className={open ? "nav is-open" : "nav"}
          aria-label="Primary"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            className="nav-cart"
            to="/shop/cart"
            aria-label="Trolley"
            onClick={() => setOpen(false)}
          >
            <TrolleyIcon className="trolley-icon" />
            {itemCount > 0 ? ` (${itemCount})` : ""}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
