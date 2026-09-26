const sideMenu = document.querySelector("#sideMenu");
const navBar = document.querySelector("nav");
const navLinks = document.querySelector("nav ul");
const landingPage = document.querySelector('.landingpage');
const aboutPage = document.querySelector('#about');
const experiencePage = document.querySelector('#experience');
const servicePage = document.querySelector('#services');
const portfolioPage = document.querySelectorAll('.headingportfoliosection, #headingportfoliosection');
const cards = document.querySelectorAll(".card");

function getSideMenu() {
  if (sideMenu) {
    sideMenu.style.transform = 'translateX(-16rem)';
  }
}

function closeSideMenu() {
  if (sideMenu) {
    sideMenu.style.transform = 'translateX(16rem)';
  }
}

window.addEventListener('scroll', () => {
  if (!navBar || !navLinks) return;
  if (window.scrollY > 50) {
    navBar.classList.add('bg-white', 'bg-opacity-50', 'backdrop-blur-lg', 'shadow-sm', 'dark:bg-darkTheme', 'dark:shadow-white/20');
    navLinks.classList.remove('bg-white', 'shadow-sm', 'bg-opacity-50', 'dark:border', 'dark:border-white/70', 'dark:bg-transparent');
  } else {
    navBar.classList.remove('bg-white', 'bg-opacity-50', 'backdrop-blur-lg', 'shadow-sm', 'dark:bg-darkTheme', 'dark:shadow-white/20');
    navLinks.classList.add('bg-white', 'shadow-sm', 'bg-opacity-50', 'dark:border', 'dark:border-white/70', 'dark:bg-transparent');
  }
});

// ----------------------light mode and dark mode ------------
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    localStorage.theme = 'dark';
  } else {
    localStorage.theme = 'light';
  }
}

// ---------------------- Dynamic Copyright Year -------------
document.querySelectorAll('.current-year').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ---------------------- GSAP Animations (Safeguarded) ------
if (typeof gsap !== 'undefined') {
  if (landingPage) {
    gsap.from(landingPage, {
      y: -50,
      duration: 1,
      opacity: 0
    });
  }

  if (aboutPage && typeof ScrollTrigger !== 'undefined') {
    gsap.from(aboutPage, {
      y: 90,
      duration: 1,
      opacity: 0,
      scrollTrigger: {
        trigger: aboutPage,
        start: "top 70%",
        end: "top 50%",
        scrub: true
      }
    });
  }

  if (experiencePage && typeof ScrollTrigger !== 'undefined') {
    gsap.from(experiencePage, {
      y: 90,
      duration: 1,
      opacity: 0,
      scrollTrigger: {
        trigger: experiencePage,
        start: "top 70%",
        end: "top 50%",
        scrub: true
      }
    });
  }

  if (servicePage && typeof ScrollTrigger !== 'undefined') {
    gsap.from(servicePage, {
      y: 90,
      duration: 1,
      opacity: 0,
      scrollTrigger: {
        trigger: servicePage,
        start: "top 70%",
        end: "top 50%",
        scrub: true
      }
    });
  }

  if (portfolioPage.length > 0 && typeof ScrollTrigger !== 'undefined') {
    gsap.from(portfolioPage, {
      y: 90,
      duration: 1,
      opacity: 0,
      scrollTrigger: {
        trigger: portfolioPage[0],
        start: "top 70%",
        end: "top 50%",
        scrub: true
      }
    });
  }

  const myWorkSection = document.querySelector('#mywork');
  if (cards.length > 0 && typeof ScrollTrigger !== 'undefined') {
    if (myWorkSection) {
      gsap.from(cards, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: myWorkSection,
          start: 'top 80%',
          once: true
        }
      });
    } else {
      gsap.from(cards, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }
  }
}