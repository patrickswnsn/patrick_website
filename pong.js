class PongGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Basic settings
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.winningScore = 5;

        // Game state
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameOver = false;
        this.gameStarted = false; 
        this.countdown = 3;
        this.pongStarted = false; 
        this.lastTime = 0;
        this.deltaTime = 0;

        // Player paddle
        this.paddle = {
            width: 12,
            height: 80,
            y: (this.canvas.height / 2) - 40,
        };

        // Computer paddle
        this.computerPaddle = {
            width: 12,
            height: 80,
            y: (this.canvas.height / 2) - 40,
            targetY: (this.canvas.height / 2) - 40,
            speed: 300  // pixels per second max speed
        };

        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 6,
            speedX: 0,
            speedY: 0,
            maxSpeed: 700,
            baseSpeed: 400,
            acceleration: 1.05
        };

        // Event binding
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.gameLoop = this.gameLoop.bind(this);

        // Listen to mouse
        this.canvas.addEventListener('mousemove', this.handleMouseMove);

        // Start countdown once start() is called
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        // Directly follow mouse within the vertical bounds
        this.paddle.y = Math.min(Math.max(mouseY - this.paddle.height / 2, 0), this.canvas.height - this.paddle.height);
    }

    resetBall(direction = 1) {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4); // -45° to 45°
        this.ball.speedX = this.ball.baseSpeed * direction;
        this.ball.speedY = this.ball.speedX * Math.tan(angle);
    }

    updateComputerPaddle() {
        if (!this.gameStarted || this.gameOver) return;

        // If the ball is on the AI's half (to the right side), follow it
        if (this.ball.x > this.canvas.width / 2) {
            this.computerPaddle.targetY = Math.min(
                Math.max(this.ball.y - this.computerPaddle.height / 2, 0), 
                this.canvas.height - this.computerPaddle.height
            );
        } else {
            // Move paddle back to center when ball is far away
            this.computerPaddle.targetY = (this.canvas.height / 2) - (this.computerPaddle.height / 2);
        }

        // Move AI paddle smoothly towards targetY
        const diff = this.computerPaddle.targetY - this.computerPaddle.y;
        const distance = Math.abs(diff);
        if (distance > 1) {
            const dir = diff > 0 ? 1 : -1;
            // Move at fraction of speed depending on distance
            const move = Math.min(this.computerPaddle.speed * this.deltaTime, distance);
            this.computerPaddle.y += move * dir;
        }
    }

    updateBall() {
        if (!this.gameStarted || this.gameOver) return;

        // Move ball
        this.ball.x += this.ball.speedX * this.deltaTime;
        this.ball.y += this.ball.speedY * this.deltaTime;

        // Collision with top/bottom
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.speedY = -this.ball.speedY;
        } else if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.y = this.canvas.height - this.ball.radius;
            this.ball.speedY = -this.ball.speedY;
        }

        // Player paddle collision
        if (this.ball.x - this.ball.radius < 40 + this.paddle.width && 
            this.ball.x > 40 && 
            this.ball.y > this.paddle.y && 
            this.ball.y < this.paddle.y + this.paddle.height) {
            // Ball hit player paddle
            const centerY = this.paddle.y + this.paddle.height / 2;
            const hitDiff = this.ball.y - centerY;
            const normalized = hitDiff / (this.paddle.height / 2); // -1 to 1
            const bounceAngle = normalized * (Math.PI / 4); // up to ±45°
            const speed = Math.min(this.ball.maxSpeed, Math.abs(this.ball.speedX) * this.ball.acceleration);

            this.ball.speedX = speed; 
            this.ball.speedY = speed * Math.sin(bounceAngle);
            // Ensure direction is to the right after bouncing off player
            if (this.ball.speedX < 0) this.ball.speedX *= -1; 
        }

        // Computer paddle collision
        const rightPaddleX = this.canvas.width - 50;
        if (this.ball.x + this.ball.radius > rightPaddleX && 
            this.ball.x < rightPaddleX + this.computerPaddle.width &&
            this.ball.y > this.computerPaddle.y &&
            this.ball.y < this.computerPaddle.y + this.computerPaddle.height) {
            // Ball hit AI paddle
            const centerY = this.computerPaddle.y + this.computerPaddle.height / 2;
            const hitDiff = this.ball.y - centerY;
            const normalized = hitDiff / (this.computerPaddle.height / 2);
            const bounceAngle = normalized * (Math.PI / 4);
            const speed = Math.min(this.ball.maxSpeed, Math.abs(this.ball.speedX) * this.ball.acceleration);

            this.ball.speedX = -speed;
            this.ball.speedY = speed * Math.sin(bounceAngle);
            // Ensure direction is to the left after bouncing off AI
            if (this.ball.speedX > 0) this.ball.speedX *= -1;
        }

        // Out of bounds scoring
        if (this.ball.x + this.ball.radius < 0) {
            // AI scores
            this.computerScore++;
            if (this.computerScore >= this.winningScore) {
                this.gameOver = true;
            } else {
                this.resetBall(1);
            }
        } else if (this.ball.x - this.ball.radius > this.canvas.width) {
            // Player scores
            this.playerScore++;
            if (this.playerScore >= this.winningScore) {
                this.gameOver = true;
            } else {
                this.resetBall(-1);
            }
        }
    }

    update() {
        if (!this.gameStarted || this.gameOver) return;

        const now = performance.now();
        this.deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.updateBall();
        this.updateComputerPaddle();
    }

    drawPaddles() {
        if (!this.gameOver) {
            // Player paddle (left)
            this.ctx.fillStyle = '#4FC1FF';
            this.ctx.fillRect(40, this.paddle.y, this.paddle.width, this.paddle.height);

            // Computer paddle (right)
            this.ctx.fillStyle = '#D7BA7D';
            this.ctx.fillRect(this.canvas.width - 50, this.computerPaddle.y, this.computerPaddle.width, this.computerPaddle.height);
        }
    }

    drawBall() {
        if (this.gameStarted && !this.gameOver) {
            this.ctx.fillStyle = (this.ball.speedX > 0) ? '#4FC1FF' : '#D7BA7D';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    drawScore() {
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#4FC1FF';
        this.ctx.fillText(`YOU: ${this.playerScore}`, 40, 30);

        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#D7BA7D';
        this.ctx.fillText(`AI: ${this.computerScore}`, this.canvas.width - 40, 30);

        // Center line when game is on
        if (this.gameStarted && !this.gameOver) {
            this.ctx.setLineDash([5, 15]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2, 0);
            this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
            this.ctx.strokeStyle = 'rgba(64, 64, 64, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Countdown before start
        if (!this.gameStarted && !this.gameOver) {
            this.ctx.textAlign = 'center';
            this.ctx.font = '72px monospace';
            this.ctx.fillStyle = '#4FC1FF';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.countdown, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textBaseline = 'alphabetic';
        }

        // Display game over message
        if (this.gameOver) {
            this.ctx.textAlign = 'center';
            this.ctx.font = '24px monospace';
            this.ctx.fillStyle = (this.playerScore >= this.winningScore) ? '#4FC1FF' : '#D7BA7D';
            const winner = (this.playerScore >= this.winningScore) ? 'YOU WIN!' : 'AI WINS!';
            this.ctx.fillText(winner, this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    gameLoop(timestamp) {
        if (!this.pongStarted) return;

        if (!this.lastTime) {
            this.lastTime = timestamp;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawPaddles();
        this.drawBall();
        this.drawScore();
        this.update();

        requestAnimationFrame(this.gameLoop);
    }

    start() {
        if (this.pongStarted) return;
        this.pongStarted = true;
        this.lastTime = performance.now();
        this.startCountdown();
        requestAnimationFrame(this.gameLoop);
    }

    resetGame() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.paddle.y = (this.canvas.height / 2) - 40;
        this.computerPaddle.y = (this.canvas.height / 2) - 40;
        this.computerPaddle.targetY = this.computerPaddle.y;
        this.resetBall(1);
        this.startCountdown();
    }

    startCountdown() {
        this.countdown = 3;
        const countdownInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown === 0) {
                clearInterval(countdownInterval);
                this.gameStarted = true;
                setTimeout(() => {
                    // Just ensure ball is in play
                    this.resetBall(1);
                }, 100);
            }
        }, 1000);
    }

    stop() {
        this.pongStarted = false;
    }
}

export default PongGame;
