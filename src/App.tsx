import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Plus,
  Minus,
  Menu,
  X,
  MessageSquare,
  Phone,
  Mail,
  LoaderCircle,
} from "lucide-react";
import { PortableText } from "@portabletext/react";
import "./styles.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import { fallbackContent, getContent, safeUrl, cmsConfigured } from "./content";
import { Artwork } from "./Artwork";
import { DisplayImage } from "./DisplayImage";
import type { Section, Settings, Item } from "./types";

function Heading({
  section,
  children,
}: {
  section: Section;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{section.eyebrow}</p>
        <h2>
          {section.headline}
          {section.highlight && (
            <>
              <br />
              <span>{section.highlight}</span>
            </>
          )}
        </h2>
      </div>
      {children ??
        (section.description && (
          <p className="section-description">{section.description}</p>
        ))}
    </div>
  );
}
function ProjectModal({
  project,
  close,
}: {
  project: Item;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button
        className="dialog-close icon-button"
        aria-label="Close project"
        onClick={close}
      >
        <X />
      </button>
      {project.image?.asset?.url ? (
        <DisplayImage image={project.image} fallbackAlt={project.title} />
      ) : (
        <Artwork variant={project.artwork} />
      )}
      <div className="dialog-content">
        <p className="eyebrow">
          {project.label} · {project.category}
        </p>
        <h2 id="project-title">{project.title}</h2>
        <p>{project.summary}</p>
        <a href="#contact" className="button dark" onClick={close}>
          Create something like this <ArrowUpRight size={18} />
        </a>
      </div>
    </dialog>
  );
}
function Contact({
  section,
  settings,
}: {
  section: Section;
  settings: Settings;
}) {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail || "")
    ? settings.contactEmail
    : "";
  const whatsappDigits = (settings.whatsappNumber || "").replace(
    /[+\s()-]/g,
    "",
  );
  const whatsapp = /^[1-9]\d{6,14}$/.test(whatsappDigits) ? whatsappDigits : "";
  const phoneDigits = (settings.phoneNumber || "").replace(/[\s()-]/g, "");
  const phone = /^\+?[1-9]\d{6,14}$/.test(phoneDigits) ? phoneDigits : "";
  const message =
    section.whatsappMessage ||
    `Hi ${settings.brandName}, I'm interested in discussing a campaign for my brand.`;
  const subject =
    section.emailSubject || `Project inquiry — ${settings.brandName}`;
  const headingId = `contact-heading-${section._key}`;
  const actions = [
    {
      key: "whatsapp",
      label: section.whatsappLabel || "WhatsApp us",
      href: whatsapp
        ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
        : undefined,
      Icon: MessageSquare,
      primary: true,
      external: true,
      unavailable: "WhatsApp contact details are not available yet.",
    },
    {
      key: "phone",
      label: `${section.phoneButtonLabel || "Call us"}${phone ? ` (${settings.phoneLabel || settings.phoneNumber})` : ""}`,
      href: phone ? `tel:${phone}` : undefined,
      Icon: Phone,
      primary: false,
      external: false,
      unavailable: "Telephone contact details are not available yet.",
    },
    {
      key: "email",
      label: section.emailLabel || "Email",
      href: email
        ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
        : undefined,
      Icon: Mail,
      primary: false,
      external: false,
      unavailable: "Email contact details are not available yet.",
    },
  ];
  return (
    <section
      id={section.anchor}
      className="contact-section section-wrap"
      aria-labelledby={headingId}
    >
      <div className="contact-copy">
        {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
        <h2 id={headingId}>
          {section.headline}
          {section.highlight && (
            <>
              <br />
              <span>{section.highlight}</span>
            </>
          )}
        </h2>
        {section.description && (
          <p className="contact-description">{section.description}</p>
        )}
        <div className="contact-actions">
          {actions.map(
            ({ key, label, href, Icon, primary, external, unavailable }) => {
              const className = `button contact-button ${primary ? "lime" : "outlined"}`;
              const content = (
                <>
                  <Icon size={23} strokeWidth={2} aria-hidden="true" />
                  <span>{label}</span>
                </>
              );
              return href ? (
                <a
                  key={key}
                  className={className}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  {content}
                </a>
              ) : (
                <button
                  key={key}
                  type="button"
                  className={className}
                  disabled
                  title={unavailable}
                >
                  {content}
                </button>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
function Block({
  section,
  settings,
  onProject,
}: {
  section: Section;
  settings: Settings;
  onProject: (item: Item) => void;
}) {
  switch (section._type) {
    case "heroBlock":
      return (
        <section
          id={section.anchor}
          className={`hero section-wrap image-${section.imagePosition === "left" ? "left" : "right"}${section.imagePosition === "left" || section.imagePosition === "right" ? " has-image-placement" : ""}`}
        >
          <DisplayImage
            className="hero-background"
            image={section.image}
            fallbackSrc="/images/hero.svg"
            defaultColorMode="blackAndWhite"
            style={
              section.imagePosition === "left"
                ? { objectPosition: "25% center" }
                : section.imagePosition === "right"
                  ? { objectPosition: "75% center" }
                  : undefined
            }
          />
          <div className="hero-overlay" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              {section.eyebrow}
            </p>
            <h1>
              {section.headline}
              <br />
              <span>{section.highlight}</span>
            </h1>
            <p className="hero-description">{section.description}</p>
            <div className="hero-actions">
              <a
                className="button lime"
                href={safeUrl(section.primaryHref) || "#contact"}
              >
                {section.primaryLabel}
                <ArrowUpRight size={17} />
              </a>
              <a
                className="button outlined"
                href={safeUrl(section.secondaryHref) || "#work"}
              >
                {section.secondaryLabel}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
          <span className="hero-direction">{section.artCaption}</span>
          <a className="scroll-cue" href="#about">
            <ArrowDown size={15} />
            SCROLL TO EXPLORE
          </a>
        </section>
      );
    case "tickerBlock":
      return (
        <section id={section.anchor} className="ticker-section">
          <div className="ticker-label">
            <p className="eyebrow">{section.eyebrow}</p>
            <p>{section.note}</p>
          </div>
          <div className="ticker-words">
            {section.labels?.map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>
        </section>
      );
    case "servicesBlock":
      return (
        <section id={section.anchor} className="services-section section-wrap">
          <Heading section={section} />
          <div
            className={`services-layout image-layout image-${section.imagePosition === "left" ? "left" : "right"}`}
          >
            <div className="services-grid image-copy">
              {section.items?.map((item, i) => (
                <article className="service-card" key={item._key}>
                  <span className="service-number">0{i + 1}</span>
                  <div>
                    <h3>
                      <a href="#contact">
                        {item.title}
                        <ArrowUpRight size={24} />
                      </a>
                    </h3>
                    <p>{item.description}</p>
                    <div className="service-tags">
                      {item.tags?.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="services-visual image-media">
              <DisplayImage
                image={section.image}
                fallbackSrc="/images/hero.svg"
                fallbackAlt="Abstract architectural forms"
                defaultColorMode="blackAndWhite"
              />
              <span>{section.note || "STRUCTURAL PRECISION"}</span>
            </div>
          </div>
        </section>
      );
    case "workBlock":
      return (
        <section id={section.anchor} className="work-section section-wrap">
          <Heading section={section} />
          <div className="work-grid">
            {section.items?.map((item) => (
              <button
                className="project-card"
                key={item._key}
                onClick={() => onProject(item)}
              >
                <div className="project-image">
                  {item.image?.asset?.url ? (
                    <DisplayImage
                      image={item.image}
                      fallbackAlt={item.title}
                      defaultColorMode="blackAndWhite"
                      loading="lazy"
                    />
                  ) : (
                    <Artwork variant={item.artwork} />
                  )}
                  <span className="project-open">
                    <ArrowUpRight size={23} />
                  </span>
                </div>
                <div className="project-info">
                  <div>
                    <p>{item.category}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      );
    case "aboutBlock": {
      const besideText =
        Boolean(section.image?.asset?.url) &&
        (section.imagePosition === "left" || section.imagePosition === "right");
      const aboutImage = section.image?.asset?.url ? (
        <DisplayImage
          className="about-image image-media"
          image={section.image}
          loading="lazy"
        />
      ) : null;
      return (
        <section id={section.anchor} className="about-section section-wrap">
          <div
            className={`about-intro${besideText ? ` image-layout image-${section.imagePosition}` : ""}`}
          >
            <div className="about-copy image-copy">
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>
                {section.headline}
                <br />
                <span>{section.highlight}</span>
              </h2>
              <p>{section.description}</p>
              <a
                className="text-link"
                href={safeUrl(section.buttonHref) || "#process"}
              >
                {section.buttonLabel || "Our approach"}
                <ArrowUpRight size={16} />
              </a>
            </div>
            {besideText && aboutImage}
          </div>
          {section.values && (
            <div className="about-values">
              {section.values.map((value) => (
                <article key={value._key}>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </article>
              ))}
            </div>
          )}
          {section.quote && <p className="about-quote">{section.quote}</p>}
          {!besideText && aboutImage}
        </section>
      );
    }
    case "processBlock":
      return (
        <section id={section.anchor} className="process-section section-wrap">
          <Heading section={section} />
          <div className="process-grid">
            {section.steps?.map((step, i) => (
              <article key={step._key}>
                <div className="step-top">
                  <span>0{i + 1}</span>
                  <ArrowRight size={22} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case "faqBlock":
      return (
        <section id={section.anchor} className="faq-section section-wrap">
          <Heading section={section} />
          <div className="faq-list">
            {section.items?.map((item) => (
              <details key={item._key}>
                <summary>
                  {item.question}
                  <Plus className="faq-plus" size={20} />
                  <Minus className="faq-minus" size={20} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "contactBlock":
      return <Contact section={section} settings={settings} />;
    case "richTextBlock":
      return (
        <section id={section.anchor} className="richtext-section section-wrap">
          <Heading section={section} />
          <div className="prose">
            {section.body && (
              <PortableText
                value={section.body}
                components={{
                  marks: {
                    link: ({ value, children }) => {
                      const href = safeUrl(value?.href);
                      return href ? (
                        <a href={href}>{children}</a>
                      ) : (
                        <>{children}</>
                      );
                    },
                  },
                }}
              />
            )}
          </div>
        </section>
      );
    case "imageBlock": {
      const besideText =
        Boolean(section.image?.asset?.url) &&
        (section.imagePosition === "left" || section.imagePosition === "right");
      return (
        <section id={section.anchor} className="image-section section-wrap">
          <div
            className={
              besideText
                ? `image-layout image-${section.imagePosition}`
                : undefined
            }
          >
            <div className="image-copy">
              {section.headline ? (
                <Heading section={section} />
              ) : (
                section.description && (
                  <p className="section-description">{section.description}</p>
                )
              )}
            </div>
            <figure className="image-media">
              {section.image?.asset?.url && (
                <DisplayImage image={section.image} loading="lazy" />
              )}
              {section.caption && <figcaption>{section.caption}</figcaption>}
            </figure>
          </div>
        </section>
      );
    }
    default:
      return null;
  }
}
export default function App() {
  const [content, setContent] = useState(fallbackContent);
  const [menuOpen, setMenuOpen] = useState(false);
  const [project, setProject] = useState<Item | null>(null);
  const [loading, setLoading] = useState(cmsConfigured);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const previousMenuOpen = useRef(false);
  useEffect(() => {
    let alive = true;
    getContent(slug)
      .then((data) => {
        if (alive) {
          if (data) setContent(data);
          else setNotFound(true);
        }
      })
      .catch((error) => {
        console.error(
          "Sanity content could not be loaded; using bundled content.",
          error,
        );
        if (alive) {
          setLoadError(true);
          if (slug !== "home") setNotFound(true);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const { page } = content;
    document.title = page.seoTitle || "Nufa Media";
    const meta = document.querySelector('meta[name="description"]');
    if (meta && page.seoDescription)
      meta.setAttribute("content", page.seoDescription);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    if (page.seoDescription)
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute("content", page.seoDescription);
  }, [content]);
  useEffect(() => {
    if (menuOpen) menuRef.current?.showModal();
    else {
      menuRef.current?.close();
      if (previousMenuOpen.current) menuTrigger.current?.focus();
    }
    previousMenuOpen.current = menuOpen;
  }, [menuOpen]);
  const { settings, page } = content;
  const nav = (settings.navigation || []).filter((link) => safeUrl(link.href));
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <a
          className="brand"
          href="#main"
          aria-label={`${settings.brandName} home`}
        >
          <strong>{settings.brandName}</strong>
          <span className="brand-descriptor">{settings.brandDescriptor}</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map((link) => (
            <a key={link._key} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="nav-cta" href={safeUrl(settings.ctaHref) || "#contact"}>
          {settings.ctaLabel}
          <ArrowUpRight size={17} />
        </a>
        <button
          className="menu-toggle icon-button"
          ref={menuTrigger}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <Menu />
        </button>
      </header>
      <dialog
        id="mobile-menu"
        className="mobile-menu"
        ref={menuRef}
        onCancel={() => setMenuOpen(false)}
        aria-label="Navigation"
      >
        <button
          className="icon-button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <X />
        </button>
        <nav>
          {nav.map((link) => (
            <a
              key={link._key}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              <ArrowUpRight />
            </a>
          ))}
          <a
            href={safeUrl(settings.ctaHref) || "#contact"}
            onClick={() => setMenuOpen(false)}
          >
            {settings.ctaLabel}
            <ArrowUpRight />
          </a>
        </nav>
      </dialog>
      <main id="main" tabIndex={-1}>
        {notFound ? (
          <section className="section-wrap">
            <h1>
              {loadError ? "Content temporarily unavailable" : "Page not found"}
            </h1>
            <p>
              {loadError
                ? "Please try again in a moment."
                : "This page has not been published yet."}
            </p>
            <a className="text-link" href="/">
              Back to home <ArrowRight size={16} />
            </a>
          </section>
        ) : loading ? (
          <div className="content-status" role="status">
            <LoaderCircle className="loading-icon" />
            Loading the latest from Nufa Media…
          </div>
        ) : (
          <>
            {loadError && (
              <p className="content-status" role="status">
                Showing our studio overview while the latest content is
                temporarily unavailable.
              </p>
            )}
            {page.sections.map((section) => (
              <Block
                key={section._key}
                section={section}
                settings={settings}
                onProject={setProject}
              />
            ))}
          </>
        )}
      </main>
      <footer className="footer section-wrap">
        <div className="footer-top">
          <a className="brand" href="#main">
            <strong>{settings.brandName}</strong>
          </a>
          <p>{settings.footerTagline}</p>
          <a href="#main" className="back-top">
            Back to top <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {settings.brandName}
          </p>
          <p>{settings.footerNote}</p>
          <div>
            {settings.socialLinks
              ?.filter((link) => safeUrl(link.href))
              .map((link) => (
                <a
                  key={link._key}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                  <ArrowUpRight size={13} />
                </a>
              ))}
          </div>
        </div>
      </footer>
      <a
        className="floating-contact"
        href={safeUrl(settings.ctaHref) || "#contact"}
      >
        <span className="status-dot" />
        {settings.ctaLabel}
        <ArrowUpRight size={15} />
      </a>
      {project && (
        <ProjectModal project={project} close={() => setProject(null)} />
      )}
    </>
  );
}
