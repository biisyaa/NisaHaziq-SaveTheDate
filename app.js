'use strict';
const cover = document.getElementById('cover');
const invitation = document.getElementById('invitation');
const nav = document.querySelector('.bottom-nav');
const guest = new URLSearchParams(location.search).get('to');
if (guest && guest.trim())
    document.getElementById('guest-name').textContent = guest.trim().slice(0, 150);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('open-invitation').addEventListener('click', async () => {
    document.getElementById('open-invitation').disabled = true;
    document.getElementById('music-control').hidden = false;
    playMusic();
    cover.classList.add('is-opening');
    if (!reducedMotion)
        await new Promise(resolve => setTimeout(resolve, 480));
    cover.hidden = true;
    invitation.hidden = false;
    nav.hidden = false;
    document.body.classList.remove('is-closed');
    window.scrollTo(0, 0);
    loadWishes(true);
    const heading = invitation.querySelector('.eyebrow');
    heading.setAttribute('tabindex', '-1');
    heading.focus({
        preventScroll: true
    });

}
);
const calendar = document.getElementById('calendar-days');
for (let i = 0; i < 6; i++) {
    const blank = document.createElement('span');
    blank.setAttribute('aria-hidden', 'true');
    calendar.append(blank);
}
for (let i = 1; i <= 30; i++) {
    const day = document.createElement('span');
    day.textContent = i;
    if (i === 1) {
        day.className = 'selected';
        day.setAttribute('aria-label', '1 November, hari pernikahan Hamam dan Wulan');
    }
    calendar.append(day);
}
const target = new Date('2026-11-01T08:00:00+07:00').getTime();
function tick() {
    let t = Math.max(0, target - Date.now());
    const values = [Math.floor(t / 86400000), Math.floor(t / 3600000) % 24, Math.floor(t / 60000) % 60, Math.floor(t / 1000) % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach( (key, i) => document.getElementById(key).textContent = String(values[i]).padStart(2, '0'));
    if (t === 0)
        document.getElementById('countdown-caption').textContent = 'Hari bahagia kami telah tiba.';
}
tick();
setInterval(tick, 1000);
document.getElementById('copy-account').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
        await navigator.clipboard.writeText('0000000000');
        status.textContent = 'Nomor rekening berhasil disalin.';
    } catch {
        status.textContent = 'Silakan salin nomor rekening di atas.';
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(document.getElementById('account-number'));
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
);
document.getElementById('back-top').addEventListener('click', () => window.scrollTo({
    top: 0,
    behavior: reducedMotion ? 'instant' : 'smooth'
}));
if ('IntersectionObserver' in window) {
    const sections = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                nav.querySelectorAll('a').forEach(a => {
                    const active = a.hash === '#' + entry.target.id;
                    a.classList.toggle('active', active);
                    if (active)
                        a.setAttribute('aria-current', 'location');
                    else
                        a.removeAttribute('aria-current');
                }
                );
            }
        }
        );
    }
    ,{
        rootMargin: '-15% 0px -55% 0px'
    });
    document.querySelectorAll('main section[id]').forEach(s => sections.observe(s));
}

const music = document.getElementById('wedding-music');
const musicToggle = document.getElementById('music-toggle');
const musicLabel = document.getElementById('music-label');
const musicIcon = document.getElementById('music-icon');
const musicStatus = document.getElementById('music-status');
music.volume = 0.55;
function syncMusic() {
    const playing = !music.paused && !music.ended;
    musicToggle.setAttribute('aria-pressed', String(playing));
    musicToggle.setAttribute('aria-label', playing ? 'Jeda musik Bermuara' : 'Putar musik Bermuara');
    musicLabel.textContent = playing ? 'Jeda musik' : 'Putar musik';
    musicIcon.setAttribute('href', playing ? '#i-pause' : '#i-play');
}
async function playMusic() {
    try {
        await music.play();
        musicStatus.textContent = '';
    } catch {
        musicStatus.textContent = 'Ketuk Putar musik untuk memulai lagu.';
    }
    syncMusic();
}
musicToggle.addEventListener('click', () => {
    if (music.paused)
        playMusic();
    else
        music.pause();
}
);
['play', 'pause', 'ended'].forEach(event => music.addEventListener(event, syncMusic));
music.addEventListener('error', () => {
    syncMusic();
    musicStatus.textContent = 'Lagu belum dapat dimuat. Coba putar kembali.';
}
);

const responseForm = document.getElementById('rsvp-form');
const responseStatus = document.getElementById('rsvp-status');
const submitButton = document.getElementById('rsvp-submit');
const guestCount = document.getElementById('rsvp-guests');
const countField = document.getElementById('guest-count-field');
let submissionKey = crypto.randomUUID();
let nextBefore = null;
let wishesLoading = false;
if (guest && guest.trim())
    document.getElementById('rsvp-name').value = guest.trim().slice(0, 100);
responseForm.addEventListener('change', () => {
    const isYes = responseForm.elements.attendance.value === 'yes';
    countField.hidden = !isYes;
    guestCount.disabled = !isYes;
}
);
responseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!responseForm.reportValidity())
        return;
    const payload = {
        submissionKey,
        name: responseForm.elements.name.value,
        attendance: responseForm.elements.attendance.value,
        guests: Number(guestCount.value),
        message: responseForm.elements.message.value,
        website: responseForm.elements.website.value
    };
    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Mengirim…';
    responseStatus.textContent = '';
    responseStatus.classList.remove('is-error');
    try {
        const response = await fetch('/api/rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || 'Belum berhasil dikirim. Silakan coba kembali.');
        responseStatus.textContent = 'Terima kasih! Konfirmasi dan pesanmu sudah tersimpan. ♡';
        responseForm.reset();
        countField.hidden = true;
        guestCount.disabled = true;
        submissionKey = crypto.randomUUID();
        await loadWishes(true);
    } catch (error) {
        responseStatus.classList.add('is-error');
        responseStatus.textContent = error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'Koneksi terputus. Isianmu tetap ada, silakan coba kirim lagi.';
    } finally {
        submitButton.disabled = false;
        submitButton.querySelector('span').textContent = 'Kirim RSVP & Ucapan';
    }
}
);
async function loadWishes(reset=false) {
    if (wishesLoading)
        return;
    wishesLoading = true;
    const list = document.getElementById('wishes-list');
    const more = document.getElementById('wishes-more');
    const retry = document.getElementById('wishes-retry');
    more.disabled = true;
    retry.hidden = true;
    try {
        const response = await fetch('/api/rsvp' + (!reset && nextBefore ? '?before=' + nextBefore : ''));
        if (!response.ok)
            throw new Error('Ucapan belum bisa dimuat.');
        const data = await response.json();
        if (reset)
            list.replaceChildren();
        data.entries.forEach(item => {
            const card = document.createElement('article');
            card.className = 'wish-card';
            const name = document.createElement('h3');
            name.textContent = item.name;
            const message = document.createElement('p');
            message.textContent = item.message;
            const date = document.createElement('time');
            date.dateTime = new Date(item.created_at).toISOString();
            date.textContent = new Intl.DateTimeFormat('id-ID',{
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Jakarta'
            }).format(new Date(item.created_at));
            card.append(name, message, date);
            list.append(card);
        }
        );
        if (reset && !data.entries.length) {
            const empty = document.createElement('p');
            empty.className = 'wishes-empty';
            empty.textContent = 'Belum ada ucapan. Jadilah yang pertama menitipkan doa baik. ♡';
            list.append(empty);
        }
        const summary = data.summary;
        document.getElementById('wishes-summary').textContent = summary.wishes + ' ucapan hangat · ' + summary.attending + ' tamu berencana hadir';
        nextBefore = data.nextBefore;
        more.hidden = !nextBefore;
    } catch {
        if (reset) {
            const error = document.createElement('p');
            error.className = 'wishes-empty';
            error.textContent = 'Ucapan belum bisa dimuat. Coba lagi sebentar ya.';
            list.replaceChildren(error);
        }
        retry.hidden = false;
    } finally {
        wishesLoading = false;
        more.disabled = false;
    }
}
document.getElementById('wishes-more').addEventListener('click', () => loadWishes(false));
document.getElementById('wishes-retry').addEventListener('click', () => loadWishes(true));

// Animate the real text without changing its accessible reading order.
if (!reducedMotion && 'IntersectionObserver' in window) {
    const movingObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
    }
    ),{
        threshold: .15
    });
    document.querySelectorAll('h2.script,.couple h3,.welcome-script').forEach(heading => {
        const original = [...heading.childNodes].map(n => n.nodeName === 'BR' ? '\n' : n.textContent).join('');
        heading.setAttribute('aria-label', original.replace(/\s+/g, ' ').trim());
        heading.replaceChildren();
        let index = 0;
        original.split(/(\s+)/).forEach(part => {
            if (!part)
                return;
            if (/^\s+$/.test(part)) {
                if (part.includes('\n'))
                    heading.append(document.createElement('br'));
                else
                    heading.append(document.createTextNode(' '));
                return;
            }
            const word = document.createElement('span');
            word.className = 'motion-word';
            word.setAttribute('aria-hidden', 'true');
            [...part].forEach(letter => {
                const char = document.createElement('span');
                char.className = 'motion-letter';
                char.style.setProperty('--letter-delay', Math.min(index++ * 22, 480) + 'ms');
                char.textContent = letter;
                word.append(char);
            }
            );
            heading.append(word);
        }
        );
        heading.classList.add('letter-motion');
        movingObserver.observe(heading);
    }
    );
    document.querySelectorAll('.couple-cutout').forEach(el => {
        el.classList.add('image-motion');
        movingObserver.observe(el);
    }
    );
    document.querySelectorAll('.verse-paper,.arch-panel,.ceremony-card,.bank-card,.rsvp-form').forEach(el => {
        el.classList.add('scroll-card');
        movingObserver.observe(el);
    }
    );
}
