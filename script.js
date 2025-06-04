class TVWatchingScene {
    constructor() {
        this.tvElement = document.getElementById('tv');
        this.regenerateTVButton = document.getElementById('regenerate-tv');
        this.regeneratePeopleButton = document.getElementById('regenerate-people');
        this.regenerateCustomPeopleButton = document.getElementById('regenerate-custom-people');
        this.modal = document.getElementById('custom-modal');
        this.closeModal = document.querySelector('.close');
        this.imageUpload = document.getElementById('image-upload');
        this.imagePreview = document.getElementById('image-preview');
        this.textDescription = document.getElementById('text-description');
        this.generateCustomButton = document.getElementById('generate-custom');
        
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

        this.regenerateCustomPeopleButton.addEventListener('click', () => {
            this.openModal();
        });

        this.closeModal.addEventListener('click', () => {
            this.closeModalHandler();
        });

        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModalHandler();
            }
        });

        this.imageUpload.addEventListener('change', (event) => {
            this.handleImageUpload(event);
        });

        this.generateCustomButton.addEventListener('click', () => {
            this.generateCustomPeople();
        });
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModalHandler() {
        this.modal.style.display = 'none';
        this.imagePreview.innerHTML = '';
        this.textDescription.value = '';
        this.imageUpload.value = '';
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image">`;
            };
            reader.readAsDataURL(file);
        }
    }

    async generateCustomPeople() {
        const hasImage = this.imageUpload.files.length > 0;
        const hasText = this.textDescription.value.trim().length > 0;
        const selectedSlot = document.getElementById('slot-selector').value;

        if (!hasImage && !hasText) {
            alert('Please either upload an image or provide a text description.');
            return;
        }

        this.closeModalHandler();
        const personElements = document.querySelectorAll('.person img');
        const targetIndex = selectedSlot === 'all' ? null : parseInt(selectedSlot) - 1;

        try {
            let customDescription = '';

            if (hasImage) {
                // Convert image to data URL for LLM
                const file = this.imageUpload.files[0];
                const imageDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Use LLM to describe the image
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Describe this person's appearance, clothing, and general characteristics. Focus on details that would help recreate them as a person sitting in a chair viewed from behind. Be concise but descriptive."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageDataUrl }
                                }
                            ]
                        }
                    ]
                });

                customDescription = completion.content;
            } else {
                customDescription = this.textDescription.value.trim();
            }

            // Generate descriptions for selected person(s)
            const indices = targetIndex !== null ? [targetIndex] : [0, 1, 2, 3];
            
            for (let i of indices) {
                this.showLoading(personElements[i].parentElement);

                try {
                    // Use LLM to create a proper prompt that maintains "back view sitting in chair"
                    const promptCompletion = await websim.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "You are a prompt generator for creating images of people sitting in chairs viewed from behind. Take the user's description and create a detailed prompt that shows the person from behind, sitting in a chair. Always include 'viewed from behind', 'sitting in chair', 'realistic style', and 'transparent background' in your response."
                            },
                            {
                                role: "user",
                                content: `Create an image prompt for: ${customDescription}. Make sure the person is viewed from behind sitting in a chair.`
                            }
                        ]
                    });

                    const finalPrompt = promptCompletion.content;

                    const result = await websim.imageGen({
                        prompt: finalPrompt,
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
                    }, indices.indexOf(i) * 200);

                } catch (error) {
                    console.error(`Error generating custom person ${i + 1}:`, error);
                } finally {
                    this.hideLoading(personElements[i].parentElement);
                }
            }

        } catch (error) {
            console.error('Error processing custom input:', error);
            alert('Error processing your input. Please try again.');
        }
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