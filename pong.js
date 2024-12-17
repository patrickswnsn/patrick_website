class PongGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pongStarted = false;
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameOver = false;
        this.winningScore = 5;
        
        // Set canvas size
        this.canvas.width = 600;
        this.canvas.height = 400;
        
        // Game objects
        this.paddle = {
            width: 12,
            height: 80,
            y: this.canvas.height / 2 - 40,
            speed: 6
        };

        this.computerPaddle = {
            width: 12,
            height: 80,
            y: this.canvas.height / 2 - 40,
            speed: 4.5
        };
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            speedX: 7,
            speedY: 0,
            maxSpeed: 15,
            acceleration: 1.06
        };

        // Bind methods
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Add event listeners
        this.canvas.addEventListener('mousemove', this.handleMouseMove);

        this.countdown = 5;
        this.showingRules = true;
        this.gameStarted = false;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        this.paddle.y = Math.min(Math.max(mouseY - this.paddle.height / 2, 0), this.canvas.height - this.paddle.height);
    }

    resetBall(direction = 1) {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.speedX = 7 * direction;
        // Random angle between -45 and 45 degrees
        const angle = (Math.random() * 90 - 45) * Math.PI / 180;
        this.ball.speedY = this.ball.speedX * Math.tan(angle);
    }

    updateComputerPaddle() {
        const paddleCenter = this.computerPaddle.y + this.computerPaddle.height / 2;
        let targetY;
        
        if (this.ball.speedX > 0) {
            const timeToIntercept = (this.canvas.width - 50 - this.ball.x) / this.ball.speedX;
            const futureY = this.ball.y + this.ball.speedY * timeToIntercept;
            const clampedY = Math.min(Math.max(futureY, this.computerPaddle.height / 2), this.canvas.height - this.computerPaddle.height / 2);
            
            // Add some randomized error to the prediction
            const maxError = 30;  // Maximum pixels of error
            const error = (Math.random() - 0.5) * maxError;  // Random error between -15 and 15 pixels
            targetY = clampedY + error;
        } else {
            // When ball is moving away, return to center with some randomness
            targetY = this.canvas.height / 2 + (Math.random() - 0.5) * 40;  // Random center position ±20px
        }
        
        const easingFactor = 0.04;  // Slightly slower reactions (was 0.05)
        
        // Only move if the difference is significant (increased threshold)
        if (Math.abs(targetY - paddleCenter) > 15) {  // Was 10
            this.computerPaddle.y += (targetY - paddleCenter) * easingFactor;
        }
        
        this.computerPaddle.y = Math.max(0, Math.min(this.canvas.height - this.computerPaddle.height, this.computerPaddle.y));
    }
    
    drawPaddles() {
        // Only draw if game is started or during countdown (not during rules)
        if (this.gameStarted || !this.showingRules) {
            // Player paddle (left) - blue
            this.ctx.fillStyle = '#4FC1FF';
            this.ctx.fillRect(40, this.paddle.y, this.paddle.width, this.paddle.height);
            // Computer paddle (right) - orange
            this.ctx.fillStyle = '#D7BA7D';
            this.ctx.fillRect(this.canvas.width - 50, this.computerPaddle.y, this.computerPaddle.width, this.computerPaddle.height);
        }
    }
    
    drawBall() {
        // Only draw ball once game has started
        if (this.gameStarted) {
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.ball.speedX > 0 ? '#4FC1FF' : '#D7BA7D';
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
    
    drawScore() {
        // Always show scores
        this.ctx.font = '16px "SF Mono", Menlo, Monaco, Consolas, monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#4FC1FF';
        this.ctx.fillText(`YOU ${this.playerScore}`, 40, 30);
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#D7BA7D';
        this.ctx.fillText(`AI ${this.computerScore}`, this.canvas.width - 40, 30);

        // Add subtle "First to 5" indicator in the center
        if (this.gameStarted && !this.gameOver) {
            this.ctx.textAlign = 'center';
            this.ctx.font = '12px "SF Mono", Menlo, Monaco, Consolas, monospace';
            this.ctx.fillStyle = '#404040';
            this.ctx.fillText('FIRST TO 5', this.canvas.width / 2, 30);
        }

        // Only draw center line when game has started
        if (this.gameStarted) {
            this.ctx.setLineDash([5, 15]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2, 0);
            this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
            this.ctx.strokeStyle = '#404040';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Show rules and countdown before game starts
        if (!this.gameStarted) {
            this.ctx.textAlign = 'center';
            const centerY = this.canvas.height / 2;
            
            // Draw big countdown number
            this.ctx.font = '72px "SF Mono", Menlo, Monaco, Consolas, monospace';
            this.ctx.fillStyle = '#4FC1FF';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.countdown, this.canvas.width / 2, centerY);
            this.ctx.textBaseline = 'alphabetic';
            
            return;
        }

        // Show game status if needed
        if (this.gameOver) {
            this.ctx.font = '24px "SF Mono", Menlo, Monaco, Consolas, monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = this.playerScore >= this.winningScore ? '#4FC1FF' : '#D7BA7D';
            const winner = this.playerScore >= this.winningScore ? 'YOU WIN!' : 'AI WINS!';
            this.ctx.fillText(winner, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px "SF Mono", Menlo, Monaco, Consolas, monospace';
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.fillText('Click "New Game" to play again', this.canvas.width / 2, this.canvas.height / 2 + 30);
        } else {
            // Show progress towards winning
            const remainingPoints = this.winningScore - Math.max(this.playerScore, this.computerScore);
            if (remainingPoints <= 2) {
                this.ctx.font = '16px "SF Mono", Menlo, Monaco, Consolas, monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = '#CCCCCC';
                this.ctx.fillText(`${remainingPoints} to win`, this.canvas.width / 2, 30);
            }
        }
    }
    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Move ball
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        // Ball collision with top and bottom
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.speedY = -this.ball.speedY * 0.95; // Slight speed loss on bounce
            this.ball.y = this.ball.y - this.ball.radius < 0 ? this.ball.radius : this.canvas.height - this.ball.radius;
        }
        
        // Ball collision with player paddle
        if (this.ball.x - this.ball.radius < 40 + this.paddle.width && 
            this.ball.x + this.ball.radius > 40 &&
            this.ball.y > this.paddle.y && 
            this.ball.y < this.paddle.y + this.paddle.height) {
            // Calculate relative intersection point (-1 to 1)
            const relativeIntersectY = (this.paddle.y + (this.paddle.height / 2)) - this.ball.y;
            const normalizedIntersectY = relativeIntersectY / (this.paddle.height / 2);
            // Calculate bounce angle (-45 to 45 degrees)
            const bounceAngle = normalizedIntersectY * 0.75; // 0.75 = 45 degrees in radians
            
            this.ball.speedX = Math.abs(this.ball.speedX) * this.ball.acceleration;
            this.ball.speedY = -this.ball.speedX * bounceAngle;
            
            // Cap speeds
            this.ball.speedX = Math.min(this.ball.speedX, this.ball.maxSpeed);
            this.ball.speedY = Math.min(Math.abs(this.ball.speedY), this.ball.maxSpeed) * Math.sign(this.ball.speedY);
            
            // Removed score increment from paddle collision
            // this.playerScore++;
        }

        // Ball collision with computer paddle
        if (this.ball.x + this.ball.radius > this.canvas.width - 50 && 
            this.ball.x - this.ball.radius < this.canvas.width - 50 + this.computerPaddle.width &&
            this.ball.y > this.computerPaddle.y && 
            this.ball.y < this.computerPaddle.y + this.computerPaddle.height) {
            // Similar angle calculation for computer paddle
            const relativeIntersectY = (this.computerPaddle.y + (this.computerPaddle.height / 2)) - this.ball.y;
            const normalizedIntersectY = relativeIntersectY / (this.computerPaddle.height / 2);
            const bounceAngle = normalizedIntersectY * 0.75;
            
            this.ball.speedX = -Math.abs(this.ball.speedX) * this.ball.acceleration;
            this.ball.speedY = -this.ball.speedX * bounceAngle;
            
            // Cap speeds
            this.ball.speedX = -Math.min(Math.abs(this.ball.speedX), this.ball.maxSpeed);
            this.ball.speedY = Math.min(Math.abs(this.ball.speedY), this.ball.maxSpeed) * Math.sign(this.ball.speedY);
            
            // Removed score increment from paddle collision
            // this.computerScore++;
        }
        
        // Ball out of bounds
        if (this.ball.x + this.ball.radius < 0) {
            this.computerScore++;
            if (this.computerScore >= this.winningScore) {
                this.gameOver = true;
            } else {
                this.resetBall(1);
            }
        } else if (this.ball.x - this.ball.radius > this.canvas.width) {
            this.playerScore++;
            if (this.playerScore >= this.winningScore) {
                this.gameOver = true;
            } else {
                this.resetBall(-1);
            }
        }

        // Update computer paddle
        this.updateComputerPaddle();
    }
    
    gameLoop() {
        if (!this.pongStarted) return;
        
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
        this.startCountdown();
        this.gameLoop();
    }

    stop() {
        this.pongStarted = false;
    }

    resetGame() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.startCountdown();
        this.resetBall(1);
        this.paddle.y = this.canvas.height / 2 - 40;
        this.computerPaddle.y = this.canvas.height / 2 - 40;
    }

    startCountdown() {
        this.countdown = 5;
        
        const countdownInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown === 0) {
                clearInterval(countdownInterval);
                this.gameStarted = true;
            }
        }, 1000);
    }
}

// Export the PongGame class
export default PongGame; 