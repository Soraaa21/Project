var settings = {
    particles: {
        length: 500, 
        duration: 2, 
        velocity: 100, 
        effect: -0.75, 
        size: 30, 
    },
};


(function () {
    var lastTime = 0;
    var vendors = ["ms", "moz", "webkit", "o"];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame =
            window[vendors[x] + "RequestAnimationFrame"];
        window.cancelAnimationFrame =
            window[vendors[x] + "CancelAnimationFrame"] ||
            window[vendors[x] + "CancelRequestAnimationFrame"];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
})();


function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
}

Particle.prototype.initialize = function (x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
};

Particle.prototype.update = function (deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
};

Particle.prototype.draw = function (ctx, image) {
    function ease(t) {
        return --t * t * t + 1;
    }
    var size =
        image.width * ease(this.age / settings.particles.duration) * 0.5;
    ctx.globalAlpha = 1 - this.age / settings.particles.duration;
    ctx.drawImage(
        image,
        this.position.x - size / 2,
        this.position.y - size / 2,
        size,
        size
    );
};

function ParticlePool(length) {
    this.particles = new Array(length);
    for (var i = 0; i < this.particles.length; i++)
        this.particles[i] = new Particle();
    this.firstActive = 0;
    this.firstFree = 0;
    this.duration = settings.particles.duration;
}

ParticlePool.prototype.add = function (x, y, dx, dy) {
    this.particles[this.firstFree].initialize(x, y, dx, dy);
    this.firstFree++;
    if (this.firstFree == this.particles.length) this.firstFree = 0;
    if (this.firstActive == this.firstFree) {
        this.firstActive++;
        if (this.firstActive == this.particles.length) this.firstActive = 0;
    }
};

ParticlePool.prototype.update = function (deltaTime) {
    if (this.firstActive < this.firstFree) {
        for (var i = this.firstActive; i < this.firstFree; i++)
            this.particles[i].update(deltaTime);
    }
    if (this.firstFree < this.firstActive) {
        for (var i = this.firstActive; i < this.particles.length; i++)
            this.particles[i].update(deltaTime);
        for (var i = 0; i < this.firstFree; i++)
            this.particles[i].update(deltaTime);
    }
    while (
        this.firstActive != this.firstFree &&
        this.particles[this.firstActive].age >= this.duration
    ) {
        this.firstActive++;
        if (this.firstActive == this.particles.length) this.firstActive = 0;
    }
};

ParticlePool.prototype.draw = function (ctx, image) {
    if (this.firstActive < this.firstFree) {
        for (var i = this.firstActive; i < this.firstFree; i++)
            this.particles[i].draw(ctx, image);
    }
    if (this.firstFree < this.firstActive) {
        for (var i = this.firstActive; i < this.particles.length; i++)
            this.particles[i].draw(ctx, image);
        for (var i = 0; i < this.firstFree; i++)
            this.particles[i].draw(ctx, image);
    }
};

function pointOnHeart(t) {
    return new Point(
        160 * Math.pow(Math.sin(t), 3),
        130 * Math.cos(t) -
            50 * Math.cos(2 * t) -
            20 * Math.cos(3 * t) -
            10 * Math.cos(4 * t) +
            25
    );
}

function createHeartImage(size, color) {
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    var t = -Math.PI;
    var point = pointOnHeart(t);
    ctx.moveTo(size / 2 + point.x * size / 350, size / 2 - point.y * size / 350);
    while (t < Math.PI) {
        t += 0.01;
        point = pointOnHeart(t);
        ctx.lineTo(
            size / 2 + point.x * size / 350,
            size / 2 - point.y * size / 350
        );
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    var image = new Image();
    image.src = canvas.toDataURL();
    return image;
}

(function (canvas) {
    var ctx = canvas.getContext("2d");
    var pool = new ParticlePool(settings.particles.length);
    var particleRate = settings.particles.length / settings.particles.duration;
    var time;

    var image = createHeartImage(settings.particles.size, "#ff69b4");

    function render() {
        requestAnimationFrame(render);
        var newTime = new Date().getTime() / 1000;
        var deltaTime = newTime - (time || newTime);
        time = newTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var amount = particleRate * deltaTime;
        for (var i = 0; i < amount; i++) {
            var angle = Math.PI - 2 * Math.PI * Math.random();
            var position = pointOnHeart(angle);
            var velocity = new Point(
                position.x * 2,
                position.y * 2
            );
            pool.add(
                canvas.width / 2 + position.x,
                canvas.height / 2 - position.y,
                velocity.x,
                -velocity.y
            );
        }

        pool.update(deltaTime);
        pool.draw(ctx, image);
    }

    function onResize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    window.onresize = onResize;
    setTimeout(function () {
        onResize();
        render();
    }, 10);
})(document.getElementById("pinkboard"));
