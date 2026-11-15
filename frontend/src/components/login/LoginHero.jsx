import { useEffect, useState } from 'react';
import Icon from './icons';
import { SMEAR_SLIDES } from './smearSlides';
import logoUrl from '../../assets/login/cell-logo.svg';

// Auto-advance always runs (also with OS "reduce motion"): a slow cross-fade has no movement.
const SLIDE_INTERVAL_MS = 6000;

/**
 * Real smear examples that cross-fade slowly. Only cell positions are drawn; class names are
 * intentionally not shown because these images belong to the diagnostic answer dataset.
 */
function SmearSlideshow() {
  const [active, setActive] = useState(0);
  const slide = SMEAR_SLIDES[active];

  useEffect(() => {
    const timer = window.setInterval(() => setActive((i) => (i + 1) % SMEAR_SLIDES.length), SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <figure className="login-visual">
      <figcaption className="login-visual__header">
        <span className="login-visual__file">
          <span className="login-visual__dot" aria-hidden="true" />
          개(Dog) 말초혈액 도말 · 100x
        </span>
        <span className="login-visual__meta">
          <span className="login-visual__tag">세포 위치 표시</span>
        </span>
      </figcaption>
      <div className="login-visual__frame">
        {SMEAR_SLIDES.map((item, index) => (
          <div key={item.id} className={`login-visual__slide${index === active ? ' is-active' : ''}`} aria-hidden={index !== active}>
            <img
              src={item.src}
              alt={index === active ? `개 혈액 도말 예시 ${index + 1}: 세포 ${item.boxes.length}개의 위치가 표시됨` : ''}
              className="login-visual__img"
              decoding="async"
            />
            {item.boxes.map(([x, y, w, h]) => (
              <span
                key={`${x}-${y}`}
                className="login-visual__box"
                style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
              />
            ))}
          </div>
        ))}
        <div className="login-visual__badge login-visual__badge--top">
          <Icon name="crosshair" size={13} />
          표시된 세포 {slide.boxes.length}개
        </div>
      </div>
    </figure>
  );
}

const FEATURES = [
  { icon: 'droplet', tone: 'indigo', title: '혈액 도말 기반 학습', desc: '진단평가와 도말 세포 분류 실습 과제' },
  { icon: 'sparkles', tone: 'violet', title: 'AI 보조 세포 라벨링', desc: 'AI가 검출한 세포를 교수자가 검토·확정' },
  { icon: 'chart', tone: 'indigo', title: '교육 및 성취도 관리', desc: '자동 채점, 혼동행렬, 학생별 학습 이력' },
];

export default function LoginHero() {
  return (
    <section className="login-hero" aria-label="CELL 플랫폼 소개">
      <div className="login-hero__grid" aria-hidden="true" />
      <div className="login-hero__glow login-hero__glow--a" aria-hidden="true" />
      <div className="login-hero__glow login-hero__glow--b" aria-hidden="true" />

      <div className="login-hero__brand">
        <div className="login-hero__brand-row">
          <img src={logoUrl} alt="" className="login-hero__logo" />
          <span className="login-hero__wordmark">CELL</span>
          <span className="login-hero__pill">Hematology AI</span>
        </div>
        <p className="login-hero__tagline">수의 혈액학 교육 및 AI 세포 라벨링 플랫폼</p>
      </div>

      <div className="login-hero__main">
        <h1 className="login-hero__title">
          혈액 도말 백혈구 분류를<br className="login-hero__br" />
          {' '}<span className="login-hero__gradient">AI 세포 검출</span>과 함께 학습합니다
        </h1>
        <p className="login-hero__lead">
          AI가 혈액 도말에서 세포를 검출하고, 교수자가 확정한 정답으로 학생의 분류를 채점합니다.
          진단평가와 실습 과제, 혼동행렬 기반 피드백을 한 곳에서 제공합니다.
        </p>

        <SmearSlideshow />

        <ul className="login-features">
          {FEATURES.map((item) => (
            <li key={item.title} className={`login-feature login-feature--${item.tone}`}>
              <span className="login-feature__icon"><Icon name={item.icon} size={15} /></span>
              <strong className="login-feature__title">{item.title}</strong>
              <span className="login-feature__desc">{item.desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="login-hero__footer">
        <span>© {new Date().getFullYear()} C.E.L.L. Platform</span>
        <span>도말 이미지: CELL 진단평가 데이터셋 (라벨 미표시)</span>
      </footer>
    </section>
  );
}
