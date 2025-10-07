(function(){
    // Design System Guide (Tailwind via CDN)
    // Colors: primary #6366f1 (indigo), accent #10b981 (emerald), bg #f9fafb
    // Typography: Inter (400/600/700)

    // Ensure Google Fonts loaded once (Tailwind is prebuilt in production)
    function ensureDesignDeps() {
        if (!document.querySelector('link[data-font-inter]')) {
            const f = document.createElement('link');
            f.rel = 'stylesheet';
            f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
            f.setAttribute('data-font-inter','1');
            document.head.appendChild(f);
        }
        document.documentElement.classList.add('scroll-smooth');
        if (!document.querySelector('link[href$="/styles/output.css"]')) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = './styles/output.css';
            document.head.appendChild(css);
        }
    }
    // Ensure a global timer badge exists in header; inject header if missing
    function ensureNavbarAndBadge() {
        let header = document.querySelector('header.navbar');
        if (!header) {
            header = document.createElement('header');
            header.className = 'navbar';
            header.innerHTML = [
                '<div class="w-full bg-white/80 backdrop-blur sticky top-0 z-50 border-b border-gray-100">',
                '  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">',
                '    <a href="./index.html" class="flex items-center gap-2">',
                '      <span class="text-2xl">📚</span>',
                '      <span class="font-semibold text-gray-800" style="font-family:Inter, sans-serif">Reading Streak</span>',
                '    </a>',
                '    <nav class="nav-links hidden md:flex items-center gap-6">',
                '      <a href="./index.html" class="text-gray-600 hover:text-indigo-600 transition">Home</a>',
                '      <a href="./leaderboard.html" class="text-gray-600 hover:text-indigo-600 transition">Leaderboard</a>',
                '      <a href="./payment.html" class="text-gray-600 hover:text-indigo-600 transition">Payment</a>',
                '      <span id="global-timer" class="text-sm text-indigo-600 font-semibold"></span>',
                '    </nav>',
                '  </div>',
                '</div>'
            ].join('');
            document.body.insertBefore(header, document.body.firstChild);
        } else {
            // Append timer badge if not present
            const nav = header.querySelector('.nav-links');
            if (nav && !nav.querySelector('#global-timer')) {
                const span = document.createElement('span');
                span.id = 'global-timer';
                span.className = 'text-sm text-indigo-600 font-semibold';
                nav.appendChild(span);
            }
        }
    }

    function ensureFooter() {
        if (document.querySelector('footer[data-global-footer]')) return;
        const footer = document.createElement('footer');
        footer.setAttribute('data-global-footer','1');
        footer.innerHTML = [
            '<div class="mt-10 border-t border-gray-100 bg-white">',
            '  <div class="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">',
            '    <div>© <span id="y"></span> Reading Streak.</div>',
            '    <div class="flex items-center gap-4">',
            '      <a href="./about.html" class="hover:text-gray-700 transition">About</a>',
            '      <a href="./leaderboard.html" class="hover:text-gray-700 transition">Leaderboard</a>',
            '      <a href="./payment.html" class="hover:text-gray-700 transition">Payment</a>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(footer);
        const y = footer.querySelector('#y'); if (y) y.textContent = new Date().getFullYear();
    }

	// Cross-page timer badge using localStorage state set by session pages
	let timerInterval = null;

	function loadTimerSeed() {
		try {
			const sessionId = localStorage.getItem('activeSessionId');
			if (!sessionId) return null;
			const stateRaw = localStorage.getItem(`timerState_${sessionId}`);
			const startMs = Number(localStorage.getItem('activeSessionStartMs')) || null;
			let state = { totalPausedTime: 0, isPaused: false, pauseStartTime: null };
			if (stateRaw) {
				try { state = Object.assign(state, JSON.parse(stateRaw) || {}); } catch(_) {}
			}
			if (!startMs) return null;
			return { sessionId, startMs, state };
		} catch (_) { return null; }
	}

	function formatMMSS(totalSeconds) {
		const m = Math.floor(totalSeconds / 60);
		const s = Math.floor(totalSeconds % 60);
		return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
	}

	function updateBadge() {
		const el = document.getElementById('global-timer');
		if (!el) return;
		const seed = loadTimerSeed();
		if (!seed) {
			el.textContent = '';
			return;
		}
		const now = Date.now();
		let elapsed = now - seed.startMs;
		let paused = Number(seed.state.totalPausedTime || 0);
		if (seed.state.isPaused && seed.state.pauseStartTime) {
			paused += (now - seed.state.pauseStartTime);
		}
		elapsed = Math.max(0, elapsed - paused);
		el.textContent = `⏱️ ${formatMMSS(elapsed / 1000)}`;
	}

    function startBadgeTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(updateBadge, 1000);
		updateBadge();
	}

	// Provide helper for session pages to seed required values
	window.__readingStreakLayout = {
		seedSessionStart(startMs) {
			if (!startMs) return;
			try { localStorage.setItem('activeSessionStartMs', String(startMs)); } catch(_) {}
			updateBadge();
		}
	};

	// Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){
            ensureDesignDeps();
            ensureNavbarAndBadge();
            ensureFooter();
            startBadgeTimer();
        });
	} else {
        ensureDesignDeps();
        ensureNavbarAndBadge();
        ensureFooter();
		startBadgeTimer();
	}
})();


