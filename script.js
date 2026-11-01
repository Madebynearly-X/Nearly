(()=>{'use strict';const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];const navToggle=$('[data-nav-toggle]'),nav=$('[data-nav]');if(navToggle&&nav){navToggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));navToggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');navToggle.textContent=open?'×':'☰'});$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Open navigation menu');navToggle.textContent='☰'}));}$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());const params=new URLSearchParams(location.search),packageSelect=$('#q-package');if(packageSelect&&params.has('package'))packageSelect.value=params.get('package');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!reduced&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});$$('.reveal').forEach(el=>observer.observe(el))}else $$('.reveal').forEach(el=>el.classList.add('is-visible'));const form=$('[data-form]');if(form){const summary=$('[data-error-summary]',form),list=$('[data-error-list]',form),live=$('[data-live]',form);const validate=()=>{let first=null;list.replaceChildren();$$('[data-error]',form).forEach(el=>{el.hidden=true;el.textContent=''});$$('[required]',form).forEach(field=>{let message='';if(!field.value.trim())message='This field is required.';else if(field.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()))message='Enter a valid email address.';if(message){const err=$('#'+field.id+'-error',form);if(err){err.textContent=message;err.hidden=false;field.setAttribute('aria-invalid','true')}const li=document.createElement('li');li.textContent=(field.labels?.[0]?.textContent||field.name)+': '+message;list.append(li);first=first||field}else field.removeAttribute('aria-invalid')});summary.hidden=!first;if(first){summary.focus();first.focus();return false}return true};form.addEventListener('submit',async e=>{if(!validate()){e.preventDefault();return}if(form.dataset.externalSubmit==='true'){return}const targetUrl=new URL(form.action || window.location.href,window.location.href);const sameOrigin=targetUrl.origin===window.location.origin;const canSubmitWithFetch=Boolean(window.fetch)&&sameOrigin;if(!canSubmitWithFetch){return}e.preventDefault();const submit=$('button[type="submit"]',form),old=submit.textContent;submit.disabled=true;submit.textContent='Sending…';try{const response=await fetch(targetUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});if(!response.ok)throw new Error('Submission failed');form.reset();if(summary)summary.hidden=true;const success=$('[data-form-success]',form);if(success){success.hidden=false;success.focus()}if(live)live.textContent='Your enquiry has been submitted.'}catch(err){form.submit()}finally{submit.disabled=false;submit.textContent=old}});$$('input,textarea,select',form).forEach(field=>field.addEventListener('input',()=>{const err=$('#'+field.id+'-error',form);if(err){err.hidden=true;err.textContent='';field.removeAttribute('aria-invalid')}}))}})();
/* Motion: auto-reveal, scroll progress, header state, tilt and spotlight */
(() => {
  'use strict';
  const instanceKey = Symbol.for('nearly.sharedMotion');
  if (window[instanceKey]) return;
  window[instanceKey] = true;

  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const header = document.querySelector('.site-header');
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  const targets = $$('.section-head,.tile,.split>*,.price-row,.faq details,.cta-band,.contact-layout>*,.feature-list li')
    .filter((el) => !el.classList.contains('reveal') && !el.closest('.reveal'));
  targets.forEach((el) => el.classList.add('reveal'));
  const allReveals = $$('.reveal');
  $$('.grid-3,.feature-list,.faq,.split,.contact-layout').forEach((group) => {
    [...group.children]
      .filter((el) => el.classList.contains('reveal'))
      .forEach((el, index) => el.style.setProperty('--d', `${(index * 0.09).toFixed(2)}s`));
  });
  $$('.price-row').forEach((el, index) => el.style.setProperty('--d', `${(index % 3 * 0.08).toFixed(2)}s`));

  let revealObserver = null;
  const reveal = (el) => {
    el.classList.add('is-visible');
    if (revealObserver) revealObserver.unobserve(el);
  };
  const syncReveals = () => {
    if (reduced.matches) {
      if (revealObserver) revealObserver.disconnect();
      allReveals.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    if ('IntersectionObserver' in window) {
      if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target);
          });
        }, { threshold: 0.12 });
      }
      targets.filter((el) => !el.classList.contains('is-visible')).forEach((el) => revealObserver.observe(el));
    } else {
      targets.forEach(reveal);
    }
  };
  syncReveals();
  document.addEventListener('transitionend', (event) => {
    const el = event.target;
    if (event.propertyName === 'opacity' && el.classList.contains('reveal') && el.classList.contains('is-visible')) {
      el.style.removeProperty('--d');
    }
  });

  const visualCards = $$('.visual-card');
  const miniWindows = visualCards
    .map((card) => ({ card, window: card.querySelector('.mini-window') }))
    .filter(({ window: miniWindow }) => miniWindow);
  const spotlightTargets = $$('.tile,.cta-band');
  const resetPointerMotion = () => {
    miniWindows.forEach(({ window: miniWindow }) => miniWindow.style.removeProperty('transform'));
    spotlightTargets.forEach((el) => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  };

  miniWindows.forEach(({ card, window: miniWindow }) => {
    const base = 'rotate(-2deg)';
    card.addEventListener('pointermove', (event) => {
      if (reduced.matches || !finePointer.matches || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      miniWindow.style.transform = `${base} rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      miniWindow.style.removeProperty('transform');
    }, { passive: true });
  });

  spotlightTargets.forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      if (reduced.matches || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      el.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    }, { passive: true });
  });

  const handleMotionChange = () => {
    syncReveals();
    if (reduced.matches || !finePointer.matches) resetPointerMotion();
  };
  if (typeof reduced.addEventListener === 'function') {
    reduced.addEventListener('change', handleMotionChange);
  } else if (typeof reduced.addListener === 'function') {
    reduced.addListener(handleMotionChange);
  }
  if (typeof finePointer.addEventListener === 'function') {
    finePointer.addEventListener('change', handleMotionChange);
  } else if (typeof finePointer.addListener === 'function') {
    finePointer.addListener(handleMotionChange);
  }
})();

/* Payment plans: service toggle for #payment-plans, and plan prefill on the contact form */
(()=>{'use strict';const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];const MARKUP={3:1.1,6:1.2};const money=n=>'R'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');const total=(base,m)=>Math.round(base*MARKUP[m]/50)*50;
const root=$('[data-plans]');if(root){const sw=$('[data-plan-switch]',root),live=$('[data-plan-live]',root);if(sw){const buttons=$$('[data-plan-service]',sw);const set=(sel,val)=>{const el=$(sel,root);if(el)el.textContent=val};const render=btn=>{const base=Number(btn.dataset.base),updates=Number(btn.dataset.updates);[3,6].forEach(m=>{const t=total(base,m);set('[data-plan-price="'+m+'"]',money(t/m));set('[data-plan-total="'+m+'"]',money(t))});set('[data-plan-price="1"]',money(base));$$('[data-plan-updates]',root).forEach(li=>{li.textContent=updates+(updates===1?' content update a month':' content updates a month')});$$('[data-plan-link]',root).forEach(a=>{a.href='contact.html?package='+btn.dataset.planService+'&plan='+a.dataset.planLink});buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));if(live)live.textContent='Showing '+btn.textContent+' plans.'};sw.hidden=false;buttons.forEach(btn=>btn.addEventListener('click',()=>render(btn)))}}
const plan=new URLSearchParams(location.search).get('plan'),details=document.getElementById('q-details');const PLANS={'6-month':'the 6-month payment plan','3-month':'the 3-month payment plan','once-off':'the once-off payment schedule'};if(details&&plan&&PLANS[plan]&&!details.value.trim())details.value="I'm interested in "+PLANS[plan]+'. Please send a written scope and quote.'})();
