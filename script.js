@import url('https://fonts.googleapis.com/css2?family=Mont:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=The+Bold+Font&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Mont', sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #0d0b0a;
  color: #f5f3f0;
  min-height: 100vh;
}


/* =========================================================
   NAVBAR
========================================================= */

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(18, 15, 13, 0.92);
  backdrop-filter: blur(8px);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  border-bottom: 1px solid rgba(139, 107, 85, 0.2);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.nav-links button {
  background: transparent;
  border: 1px solid transparent;
  color: #f5f3f0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Mont', sans-serif;
}

.nav-links button:hover {
  background-color: rgba(139, 107, 85, 0.15);
  border-color: rgba(139, 107, 85, 0.3);
}


/* =========================================================
   INSTAGRAM EN LA NAVBAR
========================================================= */

.instagram-nav {
  width: 38px;
  height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: #ffffff;
  text-decoration: none;

  border-radius: 50%;
  border: 1px solid transparent;

  font-size: 1.3rem;

  transition:
    color 0.3s ease,
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.3s ease;
}

.instagram-nav:hover {
  color: #ffffff;
  background: rgba(139, 107, 85, 0.15);
  border-color: rgba(139, 107, 85, 0.3);
  transform: translateY(-1px);
}


/* =========================================================
   SECCIÓN SUPERIOR
========================================================= */

.hero-fixed-banner {
  height: 100vh;
  width: 100%;
  background-image:
    url('assets/fondo.jpg'),
    url('assets/fondo.png'),
    url('assets/fondo.jpeg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 2rem 2rem;
  z-index: 1;
}

.hero-fixed-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(13, 11, 10, 0.82);
}

.hero-split-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1150px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3.5rem;
  align-items: center;
}


/* =========================================================
   HERO IZQUIERDA
========================================================= */

.hero-title-big {
  font-family: 'The Bold Font', sans-serif;
  font-size: 4rem;
  line-height: 1.05;
  margin-bottom: 1rem;
  color: #ffffff !important;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.hero-title-big .text-amber,
.font-amber {
  color: #9c7151 !important;
}

.about-text {
  color: #d1c7be;
  font-size: 1.05rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-weight: 400;
}

.hero-highlights {
  display: flex;
  gap: 1.5rem;
  font-size: 0.95rem;
  color: #e5ded7;
}


/* =========================================================
   TARJETA DE SEGUIMIENTO
========================================================= */

.modern-tracking-card {
  background: rgba(22, 19, 17, 0.9);
  border: 1px solid rgba(139, 107, 85, 0.35);
  padding: 1.8rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  max-width: 400px;
  margin: 0 auto;
}

.modern-tracking-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #9c7151;
}

.card-icon-header {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #9c7151;
}

.modern-tracking-card h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: #fff;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #b3a69c;
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}


/* =========================================================
   BUSCADOR
========================================================= */

.search-form-modern {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9e9187;
  font-size: 0.95rem;
  pointer-events: none;
  z-index: 5;
}

.input-wrapper input[type="text"] {
  width: 100%;
  background-color: rgba(10, 8, 7, 0.7);
  border: 1px solid #38302b;
  border-radius: 8px;
  padding: 0.75rem 1rem 0.75rem 2.6rem !important;
  color: #fff;
  outline: none;
  font-size: 0.95rem;
  font-family: 'Mont', sans-serif;
  transition: all 0.3s;
}

.input-wrapper input[type="text"]:focus {
  border-color: #9c7151;
  box-shadow: 0 0 0 2px rgba(156, 113, 81, 0.2);
}

.btn-primary-modern {
  background: #875f42;
  color: #ffffff;
  border: none;
  padding: 0.7rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Mont', sans-serif;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.btn-primary-modern:hover {
  background: #9c7151;
  transform: translateY(-1px);
}


/* =========================================================
   RESULTADOS
========================================================= */

.result-box-modern {
  margin-top: 1.2rem;
  background: rgba(13, 11, 10, 0.6);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(139, 107, 85, 0.2);
  text-align: left;
}

.result-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 8px;
}

.progress-pill {
  background: rgba(156, 113, 81, 0.15);
  color: #c49a7a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid rgba(156, 113, 81, 0.3);
  font-weight: 500;
}


/* =========================================================
   CONTENEDOR INFERIOR
========================================================= */

.black-content-container {
  position: relative;
  background-color: #0d0b0a;
  z-index: 10;
  min-height: 80vh;
}

.content-section {
  padding: 5rem 1.5rem;
  display: flex;
  justify-content: center;
}

.section-inner {
  width: 100%;
  max-width: 900px;
  text-align: center;
}

.section-inner h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}


/* =========================================================
   GRILLA DE 5 PASOS
========================================================= */

.steps-grid-5 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  text-align: left;
}

.step-box {
  background: #14110f;
  border: 1px solid #26211d;
  border-radius: 10px;
  padding: 1.5rem;
  transition: border-color 0.3s;
}

.step-box:hover {
  border-color: rgba(156, 113, 81, 0.5);
}

.step-icon {
  font-size: 1.5rem;
  color: #9c7151;
  margin-bottom: 0.75rem;
}

.step-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
  color: #fff;
}

.step-desc {
  font-size: 0.8rem;
  color: #b3a69c;
  line-height: 1.4;
}


/* =========================================================
   MODAL ADMIN
========================================================= */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-box {
  background: #161311;
  border: 1px solid rgba(156, 113, 81, 0.35);
  border-radius: 14px;
  padding: 2.5rem;
  width: 100%;
  max-width: 850px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(0,0,0,0.9);
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: #b3a69c;
  font-size: 1.6rem;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #fff;
}


/* =========================================================
   INPUTS ADMIN
========================================================= */

select,
.admin-select,
input[type="text"],
input[type="password"] {
  background-color: #0d0b0a;
  border: 1px solid #332b25;
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  color: #fff;
  outline: none;
  font-size: 0.9rem;
  font-family: 'Mont', sans-serif;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

select:focus,
.admin-select:focus,
input:focus {
  border-color: #9c7151;
  background-color: #120f0d;
}


/* =========================================================
   UTILIDADES
========================================================= */

.hidden {
  display: none !important;
}

.badge {
  background: rgba(156, 113, 81, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #c49a7a;
  font-family: monospace;
  border: 1px solid rgba(156, 113, 81, 0.3);
}

.error-msg {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 10px;
}


/* =========================================================
   FOOTER
========================================================= */

.footer {
  border-top: 1px solid #221c18;
  background: #090706;
  padding: 3rem 1.5rem;
  text-align: center;
}

.footer p {
  color: #b3a69c;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.copyright {
  color: #665b53 !important;
  font-size: 0.75rem !important;
}


/* =========================================================
   WHATSAPP FLOTANTE
========================================================= */

.whatsapp-float {
  position: fixed;

  right: 24px;
  bottom: 24px;

  width: 58px;
  height: 58px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #25D366;
  color: #ffffff;

  border-radius: 50%;

  text-decoration: none;

  font-size: 1.9rem;

  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.45),
    0 0 0 0 rgba(37, 211, 102, 0.45);

  z-index: 9999;

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.25s ease;
}

.whatsapp-float:hover {
  background: #20bd5a;
  color: #ffffff;
  transform: scale(1.08);

  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.5),
    0 0 0 8px rgba(37, 211, 102, 0.12);
}


/* =========================================================
   RESPONSIVE PARA CELULARES
========================================================= */

@media (max-width: 768px) {

  .navbar {
    padding: 0.75rem 1rem;
  }

  .nav-links {
    gap: 0.3rem;
  }

  .nav-links button {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .instagram-nav {
    width: 34px;
    height: 34px;
    font-size: 1.15rem;
  }

  .hero-fixed-banner {
    height: auto !important;
    min-height: 100vh;
    padding-top: 90px !important;
    padding-bottom: 3rem;
  }

  .hero-split-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-title-big {
    font-size: 2.7rem !important;
    line-height: 1.1;
  }

  .hero-highlights {
    justify-content: center;
  }

  .search-form-modern {
    align-items: stretch;
  }

  .modal-box {
    max-width: 100%;
    padding: 1.5rem;
  }

  .whatsapp-float {
    width: 54px;
    height: 54px;
    right: 18px;
    bottom: 18px;
    font-size: 1.75rem;
  }

}
