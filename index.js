const sideMenu = document.querySelector("#sideMenu");
const navBar = document.querySelector("nav")
const navLinks = document.querySelector("nav ul")
const landingPage = document.querySelector('.landingpage')
const aboutPage = document.querySelector('#about')
const servicePage = document.querySelector('#services')
const portfolioPage = document.querySelectorAll('#headingportfoliosection')
const cards = document.querySelectorAll(".card")
function getSideMenu(){
    sideMenu.style.transform = 'translateX(-16rem)'
}
function closeSideMenu(){
    sideMenu.style.transform = 'translateX(16rem)'
}

window.addEventListener('scroll',()=>{
    if(scrollY > 50){
        navBar.classList.add('bg-white','bg-opacity-50','backdrop-blur-lg','shadow-sm','dark:bg-darkTheme','dark:shadow-white/20')
        navLinks.classList.remove('bg-white','shadow-sm','bg-opacity-50','dark:border','dark:border-white/70','dark:bg-transparent')
    }
    else{
        navBar.classList.remove('bg-white','bg-opacity-50','backdrop-blur-lg','shadow-sm','dark:bg-darkTheme','dark:shadow-white/20')
        navLinks.classList.add('bg-white','shadow-sm','bg-opacity-50','dark:border','dark:border-white/70','dark:bg-transparent')
    }
})
// ----------------------light mode and dark mode ------------
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  function toggleTheme(){
    document.documentElement.classList.toggle('dark')
     if(document.documentElement.classList.contains('dark')){
        localStorage.theme = 'dark'
     }
     else{
        localStorage.theme = 'light'
     }
  }


  gsap.from(landingPage,{
    y:-50,
    duration : 1,
    opacity : 0
})
gsap.from(aboutPage,{
    y:90,
    duration : 1,
    opacity : 0,
    scrollTrigger : {
        trigger : aboutPage,
        start : "top 60%",
        end : "top 40%",
        // markers : true,
        scrub : true
    }
})
gsap.from(servicePage,{
    y:90,
    duration : 1,
    opacity : 0,
    scrollTrigger : {
        trigger : servicePage,
        start : "top 60%",
        end : "top 40%",
        // markers : true,
        scrub : true
    }
})
gsap.from(portfolioPage,{
    y:90,
    duration : 1,
    opacity : 0,
    scrollTrigger : {
        trigger : portfolioPage,
        start : "top 60%",
        end : "top 40%",
        // markers : true,
        scrub : true
    }
})
gsap.from(cards,{
    scale : 0.8,
    duration : 0.2,
    opacity : 0,
    scrollTrigger : {
        trigger : cards,
        start : "top 80%",
        end : "top 60%",
        // markers : true,
        scrub : true
    }
})