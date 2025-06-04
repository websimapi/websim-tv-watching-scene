class TVWatchingScene {
    constructor() {
        this.tvElement = document.getElementById('tv');
        this.tvImage = document.getElementById('tv-image');
        this.regenerateTVButton = document.getElementById('regenerate-tv');
        this.generateCharacterButton = document.getElementById('generate-character');
        this.positionSelect = document.getElementById('position-select');
        this.characterPrompt = document.getElementById('character-prompt');
        this.referenceImage = document.getElementById('reference-image');
        this.imagePreview = document.getElementById('image-preview');
        this.tvPowerButton = document.getElementById('tv-power');
        this.channelControls = document.getElementById('channel-controls');
        this.channelSelect = document.getElementById('channel-select');
        
        this.tvOn = false;
        this.channelInterval = null;
        this.currentScreenContent = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateInitialTV();
    }
    
    setupEventListeners() {
        this.regenerateTVButton.addEventListener('click', () => {
            this.regenerateTV();
        });
        
        this.generateCharacterButton.addEventListener('click', () => {
            this.generateCharacter();
        });

        this.referenceImage.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        this.tvPowerButton.addEventListener('click', () => {
            this.toggleTV();
        });

        this.channelSelect.addEventListener('change', () => {
            if (this.tvOn) {
                this.generateChannelContent();
            }
        });
    }

    toggleTV() {
        this.tvOn = !this.tvOn;
        
        if (this.tvOn) {
            this.tvPowerButton.textContent = 'Turn TV Off';
            this.tvPowerButton.classList.add('off');
            this.channelControls.style.display = 'flex';
            this.startChannelGeneration();
        } else {
            this.tvPowerButton.textContent = 'Turn TV On';
            this.tvPowerButton.classList.remove('off');
            this.channelControls.style.display = 'none';
            this.stopChannelGeneration();
            this.clearScreenContent();
        }
    }

    startChannelGeneration() {
        this.generateChannelContent();
        this.channelInterval = setInterval(() => {
            this.generateChannelContent();
        }, 30000);
    }

    stopChannelGeneration() {
        if (this.channelInterval) {
            clearInterval(this.channelInterval);
            this.channelInterval = null;
        }
    }

    async generateChannelContent() {
        if (!this.tvOn) return;

        const channel = this.channelSelect.value;
        const channelPrompts = {
            news: 'news anchor at desk, professional news studio background, breaking news graphics',
            nature: 'wild animals in their natural habitat, documentary style, beautiful landscape',
            cooking: 'chef cooking in modern kitchen, food preparation, cooking show setup',
            sports: 'sports action scene, athletes competing, stadium background',
            cartoon: 'colorful cartoon characters, animated style, fun cartoon scene',
            movie: 'dramatic movie scene, cinematic lighting, action or drama scene',
            music: 'music performance, concert stage, musicians performing'
        };

        try {
            const prompt = channelPrompts[channel];
            const result = await websim.imageGen({
                prompt: `${prompt}, high quality, realistic, television broadcast style, 16:9 aspect ratio`,
                aspect_ratio: "16:9"
            });

            this.displayScreenContent(result.url);
        } catch (error) {
            console.error('Error generating channel content:', error);
        }
    }

    displayScreenContent(imageUrl) {
        // Remove previous content
        this.clearScreenContent();

        // Create new content element
        const contentElement = document.createElement('img');
        contentElement.src = imageUrl;
        contentElement.className = 'tv-screen-content';
        
        // Wait for TV image to load, then detect white region and position content
        if (this.tvImage.complete) {
            this.positionContentInWhiteRegion(contentElement);
        } else {
            this.tvImage.onload = () => {
                this.positionContentInWhiteRegion(contentElement);
            };
        }
        
        this.tvElement.appendChild(contentElement);
        this.currentScreenContent = contentElement;

        // Fade in
        setTimeout(() => {
            contentElement.classList.add('visible');
        }, 100);
    }

    async positionContentInWhiteRegion(contentElement) {
        try {
            // Create a canvas to analyze the TV image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get image data to find white regions
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let minX = canvas.width, minY = canvas.height;
                let maxX = 0, maxY = 0;
                
                // Find the bounds of white/light gray regions (screen area)
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];
                        
                        // Check if pixel is white/light (screen area)
                        if (a > 200 && r > 200 && g > 200 && b > 200) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }
                
                // Calculate screen region as percentage of TV image
                if (maxX > minX && maxY > minY) {
                    const screenWidth = ((maxX - minX) / canvas.width) * 100;
                    const screenHeight = ((maxY - minY) / canvas.height) * 100;
                    const screenLeft = (minX / canvas.width) * 100;
                    const screenTop = (minY / canvas.height) * 100;
                    
                    // Apply positioning to content element
                    contentElement.style.position = 'absolute';
                    contentElement.style.width = `${screenWidth}%`;
                    contentElement.style.height = `${screenHeight}%`;
                    contentElement.style.left = `${screenLeft}%`;
                    contentElement.style.top = `${screenTop}%`;
                    contentElement.style.objectFit = 'cover';
                    contentElement.style.borderRadius = '4px';
                } else {
                    // Fallback positioning if white region not detected
                    contentElement.style.position = 'absolute';
                    contentElement.style.width = '75%';
                    contentElement.style.height = '65%';
                    contentElement.style.left = '12.5%';
                    contentElement.style.top = '15%';
                    contentElement.style.objectFit = 'cover';
                    contentElement.style.borderRadius = '4px';
                }
            };
            
            img.src = this.tvImage.src;
        } catch (error) {
            console.error('Error positioning content:', error);
            // Fallback positioning
            contentElement.style.position = 'absolute';
            contentElement.style.width = '75%';
            contentElement.style.height = '65%';
            contentElement.style.left = '12.5%';
            contentElement.style.top = '15%';
            contentElement.style.objectFit = 'cover';
            contentElement.style.borderRadius = '4px';
        }
    }

    clearScreenContent() {
        if (this.currentScreenContent) {
            this.currentScreenContent.remove();
            this.currentScreenContent = null;
        }
    }

    async generateInitialTV() {
        await this.regenerateTV();
    }
    
    async regenerateTV() {
        this.showLoading(this.tvElement);
        
        try {
            const tvStyles = [
                'modern flat screen TV with solid white screen display',
                'vintage CRT television with solid white screen',
                'futuristic holographic display with solid white screen',
                'retro 80s television set with solid white screen display',
                'sleek OLED smart TV with solid white screen'
            ];
            
            const randomStyle = tvStyles[Math.floor(Math.random() * tvStyles.length)];
            
            const result = await websim.imageGen({
                prompt: `${randomStyle}, front view, realistic, high quality, transparent background`,
                transparent: true,
                aspect_ratio: "4:3"
            });
            
            this.tvImage.src = result.url;
            
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
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const canvas = this.imagePreview;
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    // Resize image for preview
                    const maxSize = 200;
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    canvas.style.display = 'block';
                    
                    ctx.drawImage(img, 0, 0, width, height);
                };
                
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    async generateCharacter() {
        const selectedPosition = parseInt(this.positionSelect.value);
        const textPrompt = this.characterPrompt.value.trim();
        const hasImage = this.referenceImage.files.length > 0;
        
        if (!textPrompt && !hasImage) {
            alert('Please provide either a text description or upload a reference image.');
            return;
        }

        const personElement = document.querySelectorAll('.person img')[selectedPosition];
        this.showLoading(personElement.parentElement);
        
        try {
            let finalPrompt = '';
            
            if (hasImage && textPrompt) {
                // Both image and text provided
                const canvas = this.imagePreview;
                const imageDataUrl = canvas.toDataURL();
                
                const description = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Look at this image and the user's description: "${textPrompt}". Create a detailed prompt for generating this subject sitting in a chair viewed from behind. The final prompt must include "viewed from behind" and "sitting in a chair". Focus on the subject's appearance and clothing.`
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageDataUrl }
                                }
                            ]
                        }
                    ]
                });
                
                finalPrompt = description.content;
            } else if (hasImage) {
                // Only image provided
                const canvas = this.imagePreview;
                const imageDataUrl = canvas.toDataURL();
                
                const description = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Describe what you see in this image and create a prompt for generating this subject sitting in a chair viewed from behind. The final prompt must include 'viewed from behind' and 'sitting in a chair'."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageDataUrl }
                                }
                            ]
                        }
                    ]
                });
                
                finalPrompt = description.content;
            } else {
                // Only text provided
                const enhancedPrompt = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: `Take this description: "${textPrompt}" and create a detailed prompt for generating this subject sitting in a chair viewed from behind. The final prompt must include "viewed from behind" and "sitting in a chair". Be descriptive about appearance and clothing.`
                        }
                    ]
                });
                
                finalPrompt = enhancedPrompt.content;
            }
            
            // Generate the image
            const result = await websim.imageGen({
                prompt: `${finalPrompt}, realistic style, transparent background, sitting pose`,
                transparent: true,
                aspect_ratio: "2:3"
            });
            
            personElement.src = result.url;
            
            // Add entrance animation
            personElement.style.opacity = '0';
            personElement.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                personElement.style.transition = 'all 0.5s ease';
                personElement.style.opacity = '1';
                personElement.style.transform = 'translateY(0)';
            }, 100);
            
            // Clear inputs after successful generation
            this.characterPrompt.value = '';
            this.referenceImage.value = '';
            this.imagePreview.style.display = 'none';
            
        } catch (error) {
            console.error('Error generating character:', error);
            alert('Error generating character. Please try again.');
        } finally {
            this.hideLoading(personElement.parentElement);
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