import { Component, OnInit, AfterViewInit, OnDestroy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private zone = inject(NgZone);

  navScrolled = false;
  isLoggedIn = false;

  stats = [
    { id: 's1', display: '₹0',   target: '₹500Cr+', label: 'Total Volume Transferred' },
    { id: 's2', display: '0',    target: '50K+',    label: 'Happy Users' },
    { id: 's3', display: '0%',   target: '99.9%',   label: 'Uptime Guaranteed' },
    { id: 's4', display: '< 0s', target: '< 2s',   label: 'Average Transfer Time' }
  ];

  steps = [
    { num: '01', title: 'Create Account',  desc: 'Sign up with your username and email — no credit card required.',          color: 'sc1', side: 'left'  },
    { num: '02', title: 'Complete KYC',    desc: 'Verify with Aadhaar & PAN to unlock full wallet features.',                 color: 'sc2', side: 'right' },
    { num: '03', title: 'Add Funds',       desc: 'Top up your wallet instantly. Up to ₹50,000 per transaction.',              color: 'sc3', side: 'left'  },
    { num: '04', title: 'Send & Receive',  desc: 'Transfer money to anyone on PayVault in under 2 seconds.',                  color: 'sc4', side: 'right' }
  ];

  testimonials = [
    { initials: 'AK', name: 'Arjun Kumar',  role: 'Freelance Developer',  quote: 'PayVault changed how I receive payments. Instant and rock-solid secure.', badge: 'VERIFIED' },
    { initials: 'PR', name: 'Priya Reddy',  role: 'Small Business Owner', quote: 'Managing business payments is so much easier. The dashboard is beautiful!', badge: 'PREMIUM'  },
    { initials: 'MS', name: 'Mohammed S.',  role: 'College Student',      quote: 'Splitting bills with friends has never been this easy. Zero fees is gold!',  badge: 'STUDENT'  }
  ];

  private io!: IntersectionObserver;
  private scrollFn!: EventListener;
  private statsTriggered = false;

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
  }

  ngAfterViewInit(): void {
    // Run DOM work outside Angular zone to avoid unnecessary CD cycles
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.setupScroll();
        this.setupRevealObserver();
        this.setupCardTilt();
      }, 80);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollFn);
    this.io?.disconnect();
  }

  // ─── Navbar scroll shadow ────────────────────────────────────────────────────
  private setupScroll(): void {
    let raf: number | null = null;
    this.scrollFn = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const scrolled = window.scrollY > 20;
        if (scrolled !== this.navScrolled) {
          this.zone.run(() => this.navScrolled = scrolled);
        }
        this.animateTimeline();
      });
    };
    window.addEventListener('scroll', this.scrollFn, { passive: true });
    this.animateTimeline(); // initial call
  }

  // ─── IntersectionObserver: reveal cards, feature cards, stats ────────────────
  private setupRevealObserver(): void {
    this.io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('vis');
        // Trigger stats counter once
        if (e.target.id === 'statsBar' && !this.statsTriggered) {
          this.statsTriggered = true;
          this.zone.run(() => this.animateStats());
        }
        this.io.unobserve(e.target); // only animate once
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Observe all reveal elements
    document.querySelectorAll('.rv, .rl, .rr, .rsc, .feat-card, .tcard').forEach(el => {
      this.io.observe(el);
    });

    // Stats bar
    const sb = document.getElementById('statsBar');
    if (sb) this.io.observe(sb);
  }

  // ─── Stats counter ───────────────────────────────────────────────────────────
  private animateStats(): void {
    const targets = ['₹500Cr+', '50K+', '99.9%', '< 2s'];
    targets.forEach((t, i) => setTimeout(() => { this.stats[i].display = t; }, i * 180));
  }

  // ─── Timeline vertical line ──────────────────────────────────────────────────
  private animateTimeline(): void {
    const wrap = document.querySelector('.steps-wrap') as HTMLElement;
    const fill = document.querySelector('.v-line-fill') as HTMLElement;
    if (!wrap || !fill) return;

    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const pct = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh * 0.3)));
    fill.style.height = `${pct * 100}%`;

    document.querySelectorAll('.step-row').forEach(row => {
      if (row.getBoundingClientRect().top < vh * 0.85) {
        row.classList.add('vis');
      }
    });
  }

  // ─── 3-D card tilt ───────────────────────────────────────────────────────────
  private setupCardTilt(): void {
    const scene = document.querySelector('.card-scene') as HTMLElement;
    const card  = document.getElementById('hCard') as HTMLElement;
    if (!scene || !card) return;

    scene.addEventListener('mousemove', (e: MouseEvent) => {
      const r = scene.getBoundingClientRect();
      const rx = Math.max(-18, Math.min(18, ((e.clientY - r.top)  / r.height - .5) * -28));
      const ry = Math.max(-18, Math.min(18, ((e.clientX - r.left) / r.width  - .5) *  28));
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    scene.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }
}
