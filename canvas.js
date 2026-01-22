// Canvas Animation - Mouse Trail Effect (Optimized)
(function() {
    var ctx,
        f,
        e = 0,
        pos = {},
        lines = [],
        animationId = null,
        isInitialized = false,
        E = {
            debug: false,
            friction: 0.5,
            trails: 20,
            size: 30,
            dampening: 0.025,
            tension: 0.99,
        };

    function Oscillator(options) {
        this.phase = options.phase || 0;
        this.offset = options.offset || 0;
        this.frequency = options.frequency || 0.001;
        this.amplitude = options.amplitude || 1;
    }

    Oscillator.prototype.update = function() {
        this.phase += this.frequency;
        e = this.offset + Math.sin(this.phase) * this.amplitude;
        return e;
    };

    Oscillator.prototype.value = function() {
        return e;
    };

    function Node() {
        this.x = 0;
        this.y = 0;
        this.vy = 0;
        this.vx = 0;
    }

    function Line(options) {
        this.spring = options.spring + 0.1 * Math.random() - 0.05;
        this.friction = E.friction + 0.01 * Math.random() - 0.005;
        this.nodes = [];
        for (var i = 0; i < E.size; i++) {
            var node = new Node();
            node.x = pos.x;
            node.y = pos.y;
            this.nodes.push(node);
        }
    }

    Line.prototype.update = function() {
        var spring = this.spring,
            node = this.nodes[0];

        node.vx += (pos.x - node.x) * spring;
        node.vy += (pos.y - node.y) * spring;

        for (var i = 0; i < this.nodes.length; i++) {
            node = this.nodes[i];
            if (i > 0) {
                var prev = this.nodes[i - 1];
                node.vx += (prev.x - node.x) * spring;
                node.vy += (prev.y - node.y) * spring;
                node.vx += prev.vx * E.dampening;
                node.vy += prev.vy * E.dampening;
            }
            node.vx *= this.friction;
            node.vy *= this.friction;
            node.x += node.vx;
            node.y += node.vy;
            spring *= E.tension;
        }
    };

    Line.prototype.draw = function() {
        var node, nextNode,
            x = this.nodes[0].x,
            y = this.nodes[0].y;

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (var i = 1; i < this.nodes.length - 2; i++) {
            node = this.nodes[i];
            nextNode = this.nodes[i + 1];
            x = 0.5 * (node.x + nextNode.x);
            y = 0.5 * (node.y + nextNode.y);
            ctx.quadraticCurveTo(node.x, node.y, x, y);
        }

        node = this.nodes[i];
        nextNode = this.nodes[i + 1];
        ctx.quadraticCurveTo(node.x, node.y, nextNode.x, nextNode.y);
        ctx.stroke();
        ctx.closePath();
    };

    function onMouseMove(event) {
        function initLines() {
            lines = [];
            for (var i = 0; i < E.trails; i++) {
                lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
            }
        }

        function move(e) {
            if (e.touches) {
                pos.x = e.touches[0].pageX;
                pos.y = e.touches[0].pageY;
            } else {
                pos.x = e.clientX;
                pos.y = e.clientY;
            }
        }

        function touchStart(e) {
            if (e.touches.length === 1) {
                pos.x = e.touches[0].pageX;
                pos.y = e.touches[0].pageY;
            }
        }

        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("touchstart", onMouseMove);
        document.addEventListener("mousemove", move, { passive: true });
        document.addEventListener("touchmove", move, { passive: true });
        document.addEventListener("touchstart", touchStart, { passive: true });
        move(event);
        initLines();
        render();
    }

    function render() {
        if (ctx.running) {
            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = "hsla(255, 70%, 60%, 0.03)";
            ctx.lineWidth = 8;

            for (var i = 0; i < lines.length; i++) {
                lines[i].update();
                lines[i].draw();
            }

            ctx.frame++;
            animationId = window.requestAnimationFrame(render);
        }
    }

    function resizeCanvas() {
        if (!ctx || !ctx.canvas) return;
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
    }

    var resizeTimeout;
    function debouncedResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 100);
    }

    function renderCanvas() {
        if (isInitialized) return;

        var canvas = document.getElementById("canvas");
        if (!canvas) return;

        ctx = canvas.getContext("2d", { alpha: true });
        ctx.running = true;
        ctx.frame = 1;
        isInitialized = true;

        f = new Oscillator({
            phase: Math.random() * 2 * Math.PI,
            amplitude: 85,
            frequency: 0.0015,
            offset: 285,
        });

        document.addEventListener("mousemove", onMouseMove, { passive: true });
        document.addEventListener("touchstart", onMouseMove, { passive: true });
        window.addEventListener("resize", debouncedResize);

        window.addEventListener("focus", function() {
            if (ctx && !ctx.running) {
                ctx.running = true;
                render();
            }
        });

        window.addEventListener("blur", function() {
            ctx.running = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });

        resizeCanvas();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderCanvas);
    } else {
        renderCanvas();
    }
})();
