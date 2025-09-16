// Moving hearts background, adapted for pink theme and left drift
(function () {
	const colors = [
		"#ffd6e7", "#ffe8ef", "#fff3f6", "#ffc4d8",
		"#ffe0e9", "#ffd1dc", "#ffe9f1", "#fff8fb"
	];
	const canvas = document.getElementById("bgWords");
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	let ww = window.innerWidth, wh = window.innerHeight;
	canvas.width = ww; canvas.height = wh;

	const hearts = new Array(80).fill(0).map(() => ({
		x: Math.random() * ww,
		y: Math.random() * wh,
		opacity: Math.random() * 0.4 + 0.35,
		size: Math.random() * 36 + 16,
		vx: - (Math.random() * 1.5 + 0.2), // drift left
		vy: (Math.random() - 0.5) * 0.6
	}));

	function render() {
		ctx.clearRect(0, 0, ww, wh);
		hearts.forEach((h, i) => {
			h.x += h.vx; h.y += h.vy;
			if (h.x < -120) { h.x = ww + Math.random() * 80; h.y = Math.random() * wh; }
			ctx.globalAlpha = h.opacity;
			ctx.fillStyle = colors[i % colors.length];
			ctx.font = `${h.size}px "Microsoft YaHei"`;
			ctx.fillText("生日快乐", h.x, h.y);
		});
		requestAnimationFrame(render);
	}

	window.addEventListener('resize', () => {
		ww = window.innerWidth; wh = window.innerHeight;
		canvas.width = ww; canvas.height = wh;
	});

	requestAnimationFrame(render);
})();


