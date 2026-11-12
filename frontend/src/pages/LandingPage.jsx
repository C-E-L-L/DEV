import { useState } from 'react';
import { Link } from 'react-router-dom';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import Icon from '../components/login/icons';
import logoUrl from '../assets/login/cell-logo.svg';
import ProfessorDemo from '../components/landing/demo/ProfessorDemo';
import StudentDemo from '../components/landing/demo/StudentDemo';
import MapDemo from '../components/landing/demo/MapDemo';
import PipelineDiagram from '../components/landing/PipelineDiagram';
import ResearchViewer from '../components/landing/ResearchViewer';
import {
  LOGIN_PATH, NAV_LINKS, HERO, FEATURES, PIPELINE, RESEARCH, CTA, FOOTER,
} from '../components/landing/landingContent';
import './LandingPage.css';

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SectionHeading({ eyebrow, icon, title, desc, align = 'center' }) {
  return (
    <header className={`landing-heading landing-heading--${align}`}>
      <span className="landing-eyebrow">
        {icon && <Icon name={icon} size={12} />}
        {eyebrow}
      </span>
      <h2 className="landing-heading__title">{title}</h2>
      {desc && <p className="landing-heading__desc">{desc}</p>}
    </header>
  );
}

function Header() {
  return (
    <header className="landing-header">
      <div className="landing-container landing-header__inner">
        <a href="#about" className="landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src={logoUrl} alt="" className="landing-brand__logo" />
          <span className="landing-brand__name">CELL</span>
          <span className="landing-brand__pill">Hematology AI Hub</span>
        </a>
        <nav className="landing-nav" aria-label="섹션 이동">
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="landing-header__actions">
          <Link to={LOGIN_PATH} className="landing-link-btn">로그인</Link>
          <Link to={LOGIN_PATH} className="landing-btn landing-btn--primary landing-btn--sm">
            실습 시작하기 <Icon name="arrowRight" size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="about" className="landing-hero">
      <div className="landing-hero__bg" aria-hidden="true" />
      <div className="landing-container landing-hero__inner">
        <p className="landing-hero__badges">
          <span className="landing-badge"><Icon name="sparkles" size={12} />{HERO.badge}</span>
          <span className="landing-hero__badge-aside">{HERO.badgeAside}</span>
        </p>
        <h1 className="landing-hero__title">
          {HERO.titleLines.map((line) => <span key={line}>{line}<br /></span>)}
          <span className="landing-gradient-text">{HERO.titleAccent}</span>{HERO.titleTail}
        </h1>
        <p className="landing-hero__lead">{HERO.lead}</p>

        <div className="landing-demos">
          <ProfessorDemo />
          <StudentDemo />
        </div>
        <p className="landing-hero__caption">{HERO.demoCaption}</p>
        <p className="landing-hero__partners"><Icon name="school" size={13} />{HERO.partners}</p>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        <SectionHeading eyebrow={FEATURES.eyebrow} title={FEATURES.title} desc={FEATURES.desc} />
        <ul className="landing-cards landing-cards--3">
          {FEATURES.items.map((item) => (
            <li key={item.title} className="landing-card">
              <span className="landing-card__icon"><Icon name={item.icon} size={18} /></span>
              <h3 className="landing-card__title">{item.title}</h3>
              <p className="landing-card__desc">{item.desc}</p>
              <span className="landing-card__tag">{item.tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pipeline() {
  return (
    <section id="pipeline" className="landing-section landing-section--tinted">
      <div className="landing-container">
        <SectionHeading
          eyebrow={PIPELINE.eyebrow}
          icon="refresh"
          title={<>{PIPELINE.titleLead}<span className="landing-gradient-text">{PIPELINE.titleAccent}</span>{PIPELINE.titleTail}</>}
          desc={PIPELINE.desc}
        />
        <PipelineDiagram />
        <div className="landing-map">
          <header className="landing-map__head">
            <span className="landing-map__tag">{PIPELINE.map.tag}</span>
            <h3 className="landing-map__title">{PIPELINE.map.title}</h3>
          </header>
          <MapDemo />
          <p className="landing-map__caption">{PIPELINE.map.caption}</p>
        </div>
      </div>
    </section>
  );
}

function Research() {
  const [viewing, setViewing] = useState(null); // { doc, title }

  return (
    <section id="research" className="landing-section landing-section--tinted">
      <div className="landing-container">
        <div className="landing-research__head">
          <SectionHeading eyebrow={RESEARCH.eyebrow} title={RESEARCH.title} align="left" />
          <p className="landing-heading__desc">{RESEARCH.desc}</p>
        </div>
        <ul className="landing-cards landing-cards--2">
          {RESEARCH.items.map((item) => (
            <li key={item.title} className="landing-card landing-paper">
              <span className="landing-paper__icon"><Icon name={item.icon} size={18} /></span>
              <div>
                <p className="landing-paper__venue">
                  <span className="landing-paper__venue-tag">{item.venue}</span>
                  {item.venueAside}
                </p>
                <h3 className="landing-card__title">{item.title}</h3>
                <p className="landing-paper__authors">{item.authors}</p>
                <p className="landing-card__desc">{item.desc}</p>
                <div className="landing-paper__links">
                  {item.docs.map((doc) => (
                    <span key={doc.file} className="landing-paper__doc">
                      <button
                        type="button"
                        className="landing-paper__open"
                        onClick={() => setViewing({ doc, title: item.title })}
                        aria-haspopup="dialog"
                      >
                        <Icon name={doc.icon} size={13} />
                        {doc.label} 보기
                      </button>
                      <a href={doc.file} download={doc.downloadName} className="landing-paper__download" aria-label={`${doc.label} 다운로드`} title={`${doc.label} 다운로드`}>
                        <Icon name="download" size={13} />
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <ResearchViewer doc={viewing?.doc} title={viewing?.title} onClose={() => setViewing(null)} />
    </section>
  );
}

function CallToAction() {
  return (
    <section className="landing-cta">
      <div className="landing-container landing-cta__inner">
        <div>
          <h2 className="landing-cta__title">{CTA.title}</h2>
          <p className="landing-cta__desc">{CTA.desc}</p>
        </div>
        <Link to={LOGIN_PATH} className="landing-btn landing-btn--light">
          {CTA.button} <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer__top">
          <span className="landing-brand">
            <img src={logoUrl} alt="" className="landing-brand__logo" />
            <span className="landing-brand__name">CELL</span>
            <span className="landing-footer__tagline">{FOOTER.tagline}</span>
          </span>
          <div className="landing-footer__meta">
            {FOOTER.institutions.map((name) => <span key={name}>{name}</span>)}
            <span className="landing-footer__status"><i aria-hidden="true" />{FOOTER.status}</span>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <p>{FOOTER.copyright}</p>
          <div className="landing-footer__links">
            {FOOTER.links.map((label) => (
              <button key={label} type="button" className="landing-todo" disabled aria-disabled="true" title="아직 제공되지 않는 기능입니다.">
                {label}<span className="landing-todo__badge">준비 중</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="landing">
      <Header />
      <main>
        <Hero />
        <Pipeline />
        <Features />
        <Research />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
