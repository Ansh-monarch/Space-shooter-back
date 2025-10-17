class GameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = io();
        
        this.gameState = null;
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        this.setupEventListeners();
        this.setupSocketListeners();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', () => {
            this.socket.emit('playerShoot');
        });
    }
    
    setupSocketListeners() {
        this.socket.on('gameState', (gameState) => {
            this.gameState = gameState;
            this.updateUI();
        });
    }
    
    updateUI() {
        if (this.gameState && this.gameState.players[this.socket.id]) {
            const player = this.gameState.players[this.socket.id];
            document.getElementById('score').textContent = `Score: ${player.score}`;
            document.getElementById('health').textContent = `Health: ${Math.max(0, player.health)}`;
            document.getElementById('players').textContent = `Players: ${Object.keys(this.gameState.players).length}`;
        }
    }
    
    sendInput() {
        if (!this.gameState || !this.gameState.players[this.socket.id]) return;
        
        const player = this.gameState.players[this.socket.id];
        const centerX = player.x;
        const centerY = player.y;
        
        // Calculate rotation based on mouse position
        const dx = this.mouse.x - centerX;
        const dy = this.mouse.y - centerY;
        const rotation = Math.atan2(dy, dx);
        
        this.socket.emit('playerMove', { rotation });
    }
    
    render() {
        if (!this.gameState) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars (background)
        this.drawStars();
        
        // Draw players
        Object.values(this.gameState.players).forEach(player => {
            this.drawShip(player.x, player.y, player.rotation, player.color, player.health);
            
            // Draw player name/score
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Score: ${player.score}`, player.x, player.y - 25);
        });
        
        // Draw bullets
        this.gameState.bullets.forEach(bullet => {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw asteroids
        this.gameState.asteroids.forEach(asteroid => {
            this.drawAsteroid(asteroid.x, asteroid.y, asteroid.size, asteroid.rotation);
        });
    }
    
    drawStars() {
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            const x = (i * 123) % this.canvas.width;
            const y = (i * 321) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawShip(x, y, rotation, color, health) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        // Ship body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(10, 10);
        this.ctx.lineTo(0, 5);
        this.ctx.lineTo(-10, 10);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Health bar
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(-15, 15, 30, 3);
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(-15, 15, 30 * (health / 100), 3);
        
        this.ctx.restore();
    }
    
    drawAsteroid(x, y, size, rotation) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Create irregular shape
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size * (0.8 + Math.random() * 0.4);
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    gameLoop() {
        this.sendInput();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new GameClient();
});
