// Utilities shared across pages

function $(sel) { return document.querySelector(sel); }

function goto(url) {
	window.location.href = url;
}

// Login page logic
function initLoginPage() {
	const form = $("#loginForm");
	if (!form) return;
	const nameInput = $("#nameInput");
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		const name = (nameInput.value || "").trim();
		if (!name) {
			nameInput.focus();
			return;
		}
		sessionStorage.setItem("hb_username", name);
		goto("cake.html");
	});
}

// Cake page logic
function initCakePage() {
	const like = $("#btnLike");
	const dislike = $("#btnDislike");
	if (!like || !dislike) return;
	[like, dislike].forEach(btn => btn.addEventListener('click', () => goto('wishes.html')));

	// render name particles under cake if canvas exists
	renderNameParticles('nameParticles');
	// render tag line particles just below the name
	renderTextParticles('tagParticles', '我喜欢你');
}

// Wishes page logic
function initWishesPage() {
	const name = sessionStorage.getItem("hb_username") || "亲爱的你";
	const nameEls = document.querySelectorAll('[data-username]');
	nameEls.forEach(el => el.textContent = name);
	const area = $("#wishEditor");
	if (area && area.isContentEditable) {
		area.addEventListener('input', () => {
			sessionStorage.setItem('hb_wishes', area.innerHTML);
		});
		const saved = sessionStorage.getItem('hb_wishes');
		if (saved) area.innerHTML = saved;
	}

	// bgm toggle
	const audio = document.getElementById('bgm');
	const btn = document.getElementById('bgmToggle');
	if (audio && btn) {
		// try autoplay immediately
		audio.play().catch(function(){ /* some browsers block until user gesture */ });
		btn.addEventListener('click', function(){
			if (audio.paused) {
				audio.play().catch(function(){ /* ignore autoplay block */ });
				btn.style.opacity = '1';
			} else {
				audio.pause();
				btn.style.opacity = '0.7';
			}
		});
		btn.style.opacity = '0.7';
	}
}

// Simple cake drawing
function drawCake(canvasId) {
	const canvas = document.getElementById(canvasId);
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	const w = canvas.width = 400;
	const h = canvas.height = 230;
	ctx.clearRect(0,0,w,h);
	// plate
	ctx.fillStyle = '#f8e7ea';
	ctx.fillRect(60, 180, 280, 12);
	// cake body
	ctx.fillStyle = '#9b6b64';
	ctx.fillRect(100, 120, 200, 60);
	ctx.fillStyle = '#c5968f';
	ctx.fillRect(100, 160, 200, 20);
	// icing top
	ctx.fillStyle = '#fff8f8';
	ctx.beginPath();
	ctx.moveTo(100, 120);
	ctx.lineTo(300, 120);
	ctx.lineTo(300, 100);
	ctx.lineTo(100, 100);
	ctx.closePath();
	ctx.fill();
	// drip
	ctx.beginPath(); ctx.arc(130, 120, 10, 0, Math.PI, true); ctx.fill();
	ctx.beginPath(); ctx.arc(170, 120, 8, 0, Math.PI, true); ctx.fill();
	ctx.beginPath(); ctx.arc(210, 120, 12, 0, Math.PI, true); ctx.fill();
	ctx.beginPath(); ctx.arc(250, 120, 9, 0, Math.PI, true); ctx.fill();
	// candle
	ctx.fillStyle = '#fff';
	ctx.fillRect(195, 60, 10, 40);
	ctx.fillStyle = '#ffef85';
	ctx.beginPath();
	ctx.ellipse(200, 50, 8, 12, 0, 0, Math.PI * 2);
	ctx.fill();
}

// Expose to global for non-module pages
window.HB = { initLoginPage, initCakePage, initWishesPage, drawCake };

// Particle text (inspired by referenced article)
function renderNameParticles(canvasId){
	var canvas = document.getElementById(canvasId);
	if (!canvas) return;
	var ctx = canvas.getContext('2d');
	var dots = [];
	var img, gap, baseR, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

	function resize(){
		var cssW = canvas.clientWidth || canvas.offsetWidth || 360;
		var cssH = canvas.clientHeight || canvas.offsetHeight || 160;
		canvas.width = Math.floor(cssW * dpr);
		canvas.height = Math.floor(cssH * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		buildDots();
	}

	function buildDots(){
		dots = [];
		var name = (sessionStorage.getItem('hb_username') || '亲爱的你');
		var off = document.createElement('canvas');
		var offCtx = off.getContext('2d');
		off.width = canvas.width; off.height = canvas.height;
		offCtx.clearRect(0,0,off.width, off.height);
		offCtx.fillStyle = '#ff9ec0';
		var usableW = (canvas.width/dpr) - 40;
		var usableH = (canvas.height/dpr) - 20;
		var fontSize = Math.floor(Math.min((canvas.width/dpr) * 0.34, (canvas.height/dpr) * 0.78));
		fontSize = Math.max(32, Math.min(140, fontSize));
		offCtx.textAlign = 'center';
		offCtx.textBaseline = 'middle';
		offCtx.font = '900 '+fontSize+'px Arial';
		offCtx.fillText(name, off.width/2, off.height/2);

		// compute bbox and center shift
		var data = offCtx.getImageData(0,0,off.width, off.height).data;
		var minx=Infinity, maxx=-Infinity, miny=Infinity, maxy=-Infinity;
		for (var y=0; y<off.height; y++){
			for (var x=0; x<off.width; x++){
				var a = data[(y*off.width + x)*4 + 3];
				if (a>10){ if (x<minx) minx=x; if (x>maxx) maxx=x; if (y<miny) miny=y; if (y>maxy) maxy=y; }
			}
		}
		var cx = (minx+maxx)/2, cy = (miny+maxy)/2;
		var dx = off.width/2 - cx, dy = off.height/2 - cy;

		img = offCtx.getImageData(0,0,off.width, off.height).data;
		gap = (window.innerWidth>500 && window.innerHeight>500) ? 8 : 6; // spacing similar to article
		baseR = 1.8;
		for (var y=0; y<off.height; y+=gap){
			for (var x=0; x<off.width; x+=gap){
				var idx = (y*off.width + x)*4 + 3;
				if (img[idx] > 110){
					// convert device-pixel coords to CSS pixels to match ctx transform
					var targetX = (x + dx) / dpr;
					var targetY = (y + dy) / dpr;
					dots.push({
						x: Math.random()*(off.width/dpr),
						y: (off.height/dpr) + Math.random()*80,
						tx: targetX,
						ty: targetY,
						vx: 0, vy: 0,
						a: 0,
						phase: Math.random()*Math.PI*2
					});
				}
			}
		}
	}

	var t = 0;
	function tick(){
		ctx.clearRect(0,0,canvas.width, canvas.height);
		ctx.save();
		ctx.shadowColor = 'rgba(255,105,180,0.85)';
		ctx.shadowBlur = 10;
		dots.forEach(function(d){
			var dx = d.tx - d.x, dy = d.ty - d.y;
			d.vx += dx * 0.03; d.vy += dy * 0.03;
			d.vx *= 0.86; d.vy *= 0.86;
			d.x += d.vx; d.y += d.vy;
			d.a += 0.03; if (d.a > 1) d.a = 1;
			var breath = 0.6 + 0.4 * (0.5 + 0.5*Math.sin(t*1.1 + d.phase));
			ctx.globalAlpha = d.a * breath;
			ctx.beginPath();
			ctx.fillStyle = '#ff6aa2';
			var r = baseR + 1.0 * Math.sin(t*1.2 + d.phase);
			ctx.arc(d.x, d.y, r, 0, Math.PI*2);
			ctx.fill();
			ctx.globalAlpha = 1;
		});
		ctx.restore();
		t += 0.04;
		requestAnimationFrame(tick);
	}

	window.addEventListener('resize', resize);
	resize();
	requestAnimationFrame(tick);
}

// Generic text particle renderer for a given canvas and text
function renderTextParticles(canvasId, text){
	var canvas = document.getElementById(canvasId);
	if (!canvas) return;
	var ctx = canvas.getContext('2d');
	var dots = [];
	var img, gap, baseR, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

	function resize(){
		var cssW = canvas.clientWidth || canvas.offsetWidth || 360;
		var cssH = canvas.clientHeight || canvas.offsetHeight || 160;
		canvas.width = Math.floor(cssW * dpr);
		canvas.height = Math.floor(cssH * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		buildDots();
	}

	function buildDots(){
		dots = [];
		var off = document.createElement('canvas');
		var offCtx = off.getContext('2d');
		off.width = canvas.width; off.height = canvas.height;
		offCtx.clearRect(0,0,off.width, off.height);
		offCtx.fillStyle = '#ff9ec0';
		// match name particles sizing for identical font size
		var fontSize = Math.floor(Math.min((canvas.width/dpr) * 0.34, (canvas.height/dpr) * 0.78));
		fontSize = Math.max(32, Math.min(140, fontSize));
		offCtx.textAlign = 'center';
		offCtx.textBaseline = 'middle';
		offCtx.font = '800 '+fontSize+'px Arial';
		offCtx.fillText(text, off.width/2, off.height/2);

		// compute bbox and center shift
		var data = offCtx.getImageData(0,0,off.width, off.height).data;
		var minx=Infinity, maxx=-Infinity, miny=Infinity, maxy=-Infinity;
		for (var y=0; y<off.height; y++){
			for (var x=0; x<off.width; x++){
				var a = data[(y*off.width + x)*4 + 3];
				if (a>10){ if (x<minx) minx=x; if (x>maxx) maxx=x; if (y<miny) miny=y; if (y>maxy) maxy=y; }
			}
		}
		var cx = (minx+maxx)/2, cy = (miny+maxy)/2;
		var dx = off.width/2 - cx, dy = off.height/2 - cy;

		img = offCtx.getImageData(0,0,off.width, off.height).data;
		gap = (window.innerWidth>500 && window.innerHeight>500) ? 8 : 6;
		baseR = 1.2; // smaller radius to be less prominent
		for (var y=0; y<off.height; y+=gap){
			for (var x=0; x<off.width; x+=gap){
				var idx = (y*off.width + x)*4 + 3;
				if (img[idx] > 110){
					var targetX = (x + dx) / dpr;
					var targetY = (y + dy) / dpr;
					dots.push({
						x: Math.random()*(off.width/dpr),
						y: (off.height/dpr) + Math.random()*80,
						tx: targetX,
						ty: targetY,
						vx: 0, vy: 0,
						a: 0,
						phase: Math.random()*Math.PI*2
					});
				}
			}
		}
	}

	var t = 0;
	function tick(){
		ctx.clearRect(0,0,canvas.width, canvas.height);
		ctx.save();
		ctx.shadowColor = 'rgba(255,192,203,0.65)';
		ctx.shadowBlur = 6;
		dots.forEach(function(d){
			var dx = d.tx - d.x, dy = d.ty - d.y;
			d.vx += dx * 0.03; d.vy += dy * 0.03;
			d.vx *= 0.86; d.vy *= 0.86;
			d.x += d.vx; d.y += d.vy;
			d.a += 0.03; if (d.a > 1) d.a = 1;
			var breath = 0.6 + 0.4 * (0.5 + 0.5*Math.sin(t*1.1 + d.phase));
			ctx.globalAlpha = 0.5 * d.a * breath; // 50% visibility
			ctx.beginPath();
			ctx.fillStyle = '#ffc3d8';
			var r = baseR + 0.8 * Math.sin(t*1.2 + d.phase);
			ctx.arc(d.x, d.y, r, 0, Math.PI*2);
			ctx.fill();
			ctx.globalAlpha = 1;
		});
		ctx.restore();
		t += 0.04;
		requestAnimationFrame(tick);
	}

	window.addEventListener('resize', resize);
	resize();
	requestAnimationFrame(tick);
}


