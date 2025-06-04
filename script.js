class TVWatchingScene {
    constructor() {
        this.tvElement = document.getElementById('tv');
        this.regenerateTVButton = document.getElementById('regenerate-tv');
        this.generateCharacterButton = document.getElementById('generate-character');
        this.positionSelect = document.getElementById('position-select');
        this.characterPrompt = document.getElementById('character-prompt');
        this.referenceImage = document.getElementById('reference-image');
        this.imagePreview = document.getElementById('image-preview');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
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
    
    async generateInitialAssets() {
        // Remove automatic generation
        console.log('TV watching scene ready for user input...');
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