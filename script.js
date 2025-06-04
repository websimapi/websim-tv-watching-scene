class TVWatchingScene {
    constructor() {
        this.tvElement = document.getElementById('tv');
        this.regenerateTVButton = document.getElementById('regenerate-tv');
        this.regeneratePeopleButton = document.getElementById('regenerate-people');
        
        this.init();
    }
    
    init() {
        this.generateInitialAssets();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.regenerateTVButton.addEventListener('click', () => {
            this.regenerateTV();
        });
        
        this.regeneratePeopleButton.addEventListener('click', () => {
            this.regeneratePeople();
        });
    }
    
    async generateInitialAssets() {
        console.log('Generating initial TV watching scene...');
        await this.regeneratePeople();
    }
    
    async regenerateTV() {
        this.showLoading(this.tvElement);
        
        try {
            const tvStyles = [
                'modern flat screen TV',
                'vintage CRT television',
                'futuristic holographic display',
                'retro 80s television set',
                'sleek OLED smart TV'
            ];
            
            const randomStyle = tvStyles[Math.floor(Math.random() * tvStyles.length)];
            
            const result = await websim.imageGen({
                prompt: `${randomStyle} with a bright white glowing screen, front view, realistic, high quality, isolated on transparent background`,
                transparent: true,
                aspect_ratio: "4:3"
            });
            
            // Create new TV image and replace the current TV
            const newTV = document.createElement('img');
            newTV.src = result.url;
            newTV.style.width = '100%';
            newTV.style.height = '100%';
            newTV.style.objectFit = 'contain';
            
            // Clear current TV content and add new image
            this.tvElement.innerHTML = '';
            this.tvElement.appendChild(newTV);
            
            // Add some visual feedback
            this.tvElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.tvElement.style.transform = 'scale(1)';
            }, 300);
            
        } catch (error) {
            console.error('Error generating TV:', error);
        } finally {
            this.hideLoading(this.tvElement);
        }
    }
    
    async regeneratePeople() {
        const personElements = document.querySelectorAll('.person img');
        
        const peoplePrompts = [
            'person sitting in a comfortable armchair viewed from behind, wearing casual clothes',
            'person sitting in a modern chair from the back, wearing a hoodie',
            'person sitting in a recliner chair viewed from behind, wearing a t-shirt',
            'person sitting in a wooden chair from the back, wearing a sweater'
        ];
        
        for (let i = 0; i < personElements.length; i++) {
            this.showLoading(personElements[i].parentElement);
            
            try {
                const result = await websim.imageGen({
                    prompt: `${peoplePrompts[i]}, realistic style, transparent background, sitting pose`,
                    transparent: true,
                    aspect_ratio: "2:3"
                });
                
                personElements[i].src = result.url;
                
                // Add entrance animation
                personElements[i].style.opacity = '0';
                personElements[i].style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    personElements[i].style.transition = 'all 0.5s ease';
                    personElements[i].style.opacity = '1';
                    personElements[i].style.transform = 'translateY(0)';
                }, i * 200);
                
            } catch (error) {
                console.error(`Error generating person ${i + 1}:`, error);
            } finally {
                this.hideLoading(personElements[i].parentElement);
            }
        }
    }
    
    showLoading(element) {
        element.classList.add('loading');
    }
    
    hideLoading(element) {
        element.classList.remove('loading');
    }
}

// Initialize the scene when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TVWatchingScene();
});

