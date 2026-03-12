const app = {
    settings: JSON.parse(localStorage.getItem('userSettings')) || { delay: 2, theme: 'light' },
    isPaused: false,
    recipes: [],

    users: [
        { username: "admin", password: "123" },
        { username: "user", password: "456" }
    ],

    defaultRecipes: [
        {
            id: 1,
            title: "Tomato Pasta",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
            ingredients: "Pasta, tomatoes, garlic, basil",
            instructions: ["Boil water and cook the pasta", "Sauté garlic in olive oil", "Add tomatoes and cook for 10 minutes"]
        },
        {
            id: 2,
            title: "Rich Omelet",
            image: "https://images.unsplash.com/photo-1510627489930-0c1b0ba3ff18?w=400",
            ingredients: "2 eggs, parsley, salt, pepper",
            instructions: ["Whisk eggs with herbs", "Heat pan with oil", "Fry on both sides"]
        },
        {
            id: 3,
            title: "Fresh Salads",
            image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
            ingredients: "Cucumber, tomato, cheese, olives",
            instructions: ["Cut vegetables into cubes", "Add cheese and olives", "Season with olive oil and lemon"]
        },
        {
            id: 4,
            title: "Hot Chocolate Cake",
            image: "https://images.unsplash.com/photo-1564035032355-2c6482d01d40?w=400",
            ingredients: "Flour, sugar, cocoa, milk",
            instructions: ["Mix everything in a mug", "Microwave for 90 seconds", "Wait to cool and eat"]
        },
        {
            id: 5,
            title: "Frozen Fruit Shake",
            image: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=400",
            ingredients: "Banana, frozen mango, 1 cup milk",
            instructions: ["Put everything in a blender", "Grind until smooth", "Pour into a large glass"]
        }
    ],

    init() {
        const savedRecipes = JSON.parse(localStorage.getItem('recipes'));
        if (!savedRecipes || savedRecipes.length < 5) {
            this.recipes = this.defaultRecipes;
            localStorage.setItem('recipes', JSON.stringify(this.defaultRecipes));
        } else {
            this.recipes = savedRecipes;
        }
        this.applySettings();
    },

    // פונקציית עזר להשמעת צליל קצר במעבר מסכים (משוב למשתמש)
    playSystemSound(text) {
        const msg = new SpeechSynthesisUtterance(text);
        msg.volume = 0.2;
        msg.rate = 1.5;
        window.speechSynthesis.speak(msg);
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            // אפקט כניסה חלק
            target.style.animation = 'fadeInScale 0.4s ease-out';
        }
    },

    login() {
        const userVal = document.getElementById('username').value;
        const passVal = document.getElementById('password').value;
        const foundUser = this.users.find(u => u.username === userVal && u.password === passVal);

        if (foundUser) {
            this.playSystemSound("Welcome");
            this.renderRecipes();
            this.showScreen('recipeListScreen');
        } else {
            alert("Invalid credentials. Try admin/123");
        }
    },

    renderRecipes(list = this.recipes) {
        const container = document.getElementById('recipesContainer');
        if (!container) return;
        container.innerHTML = list.map(r => `
            <div class="recipe-card" onclick="app.openRecipe(${r.id})">
                <img src="${r.image || 'https://via.placeholder.com/80'}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; margin-right: 15px;">
                <div class="recipe-info">
                    <h3 style="margin:0;">${r.title}</h3>
                    <small style="color: #636e72;">${r.instructions.length} steps</small>
                </div>
            </div>
        `).join('');
    },

    filterRecipes() {
        const term = document.getElementById('searchInput').value.toLowerCase();
        const filtered = this.recipes.filter(r => r.title.toLowerCase().includes(term));
        this.renderRecipes(filtered);
    },

    // פונקציות להוספת מתכון חדש
    addRecipePrompt() {
        this.showScreen('addRecipeModal');
    },

    closeModal() {
        this.showScreen('recipeListScreen');
    },

    saveNewRecipe() {
        const title = document.getElementById('newTitle').value;
        const ingredients = document.getElementById('newIngredients').value;
        const instructionsRaw = document.getElementById('newInstructions').value;

        if (!title || !instructionsRaw) return alert("Please fill title and instructions");

        const newRecipe = {
            id: Date.now(),
            title: title,
            image: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400", // תמונת ברירת מחדל
            ingredients: ingredients,
            instructions: instructionsRaw.split('\n').filter(line => line.trim() !== "")
        };

        this.recipes.push(newRecipe);
        localStorage.setItem('recipes', JSON.stringify(this.recipes));

        // ניקוי שדות ורענון
        document.getElementById('newTitle').value = '';
        document.getElementById('newIngredients').value = '';
        document.getElementById('newInstructions').value = '';

        this.renderRecipes();
        this.closeModal();
    },

    openRecipe(id) {
        const r = this.recipes.find(recipe => recipe.id === id);
        this.currentRecipe = r;
        document.getElementById('viewTitle').innerText = r.title;
        document.getElementById('viewIngredients').innerText = "Ingredients: " + r.ingredients;
        document.getElementById('viewInstructions').innerHTML = r.instructions.map(i => `<p>• ${i}</p>`).join('');
        this.showScreen('recipeViewScreen');
    },

    startReading() {
        window.speechSynthesis.cancel();
        this.isPaused = false;
        document.getElementById('pauseBtn').innerText = "⏸️ Pause";

        let delayTime = (parseFloat(this.settings.delay) || 2) * 1000;
        this.currentRecipe.instructions.forEach((text, index) => {
            setTimeout(() => {
                if (!this.isPaused && this.currentRecipe) {
                    const utter = new SpeechSynthesisUtterance(text);
                    utter.lang = 'en-US';
                    window.speechSynthesis.speak(utter);
                }
            }, index * delayTime);
        });
    },

    togglePause() {
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
            if (this.isPaused) {
                window.speechSynthesis.resume();
                this.isPaused = false;
                document.getElementById('pauseBtn').innerText = "⏸️ Pause";
            } else {
                window.speechSynthesis.pause();
                this.isPaused = true;
                document.getElementById('pauseBtn').innerText = "▶️ Resume";
            }
        }
    },

    stopReading() {
        window.speechSynthesis.cancel();
        this.isPaused = false;
        document.getElementById('pauseBtn').innerText = "⏸️ Pause";
    },

    saveSettings() {
        this.settings.delay = document.getElementById('delayInput').value;
        this.settings.theme = document.getElementById('themeSelect').value;
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        this.applySettings();
        this.showScreen('recipeListScreen');
    },

    applySettings() {
        document.body.className = this.settings.theme + "-mode";
        if (document.getElementById('delayInput')) document.getElementById('delayInput').value = this.settings.delay;
        if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = this.settings.theme;
    }
};

app.init();