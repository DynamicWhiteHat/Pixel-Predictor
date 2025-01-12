const canvas = document.getElementById("drawing-board");
const toolbar = document.getElementById("toolbar");
const ctx = canvas.getContext("2d");

const slider = document.getElementById("myRange");
const sizeValue = document.getElementById("sizeValue");
const responsetext = document.getElementById("response");
const prompt_text = document.getElementById("prompt");
const timerSet = document.getElementById("timerSet");
const win = document.getElementById("winner");
const reload = document.getElementById("reload");
const popup = document.getElementById("popup");

// Groq
const apiKey = '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';
let lastSentTime = 0;
const API_LIMIT_INTERVAL = 5000; 

let oldImage;
let currentImage;
let response;
let select = true;
let timerStart = false;

// Create brush preview element
const brushPreview = document.createElement("div");
document.body.appendChild(brushPreview);

// Initialize brush size and styles
let lineWidth = 5;
let strokeColor = "black"; // Default color
const updateBrushPreview = () => {
    brushPreview.style.width = `${lineWidth + 10}px`;
    brushPreview.style.height = `${lineWidth + 10}px`;
};
Object.assign(brushPreview.style, {
    position: "absolute",
    borderRadius: "50%",
    border: "2px solid gray",
    backgroundColor: "transparent",
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    zIndex: "9999",
    display: "none", // Initially hidden
});

// Initialize brush preview size
updateBrushPreview();

// Canvas setup
const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;
canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

let isPainting = false;
let finished =false;
const winMessages = [
    "Is that Picasso?",
    "Bob Ross? Is it really you?",
    "Masterpiece achieved!",
    "You're an artist!",
    "Winning with your creativity!",
    "That's pure genius!",
    "Did you just create magic?",
    "Impressive artwork!",
    "Is this the next Mona Lisa?",
    "Art level: Expert!",
    "You’ve got the golden touch!",
    "That’s some next-level drawing!",
    "You’re a true sketch master!",
    "Paint it like you own it!",
    "Drawing wizard in the house!",
    "Art history in the making!",
    "Bravo, Da Vinci!",
    "Creative genius at work!",
    "That’s a gallery-worthy piece!",
    "You nailed it!",
    "Art has a new champion!",
    "Can we get this framed?",
    "You’ve got the artist’s touch!"
];

const easyPrompts = [
    "Apple",
    "Tree",
    "House",
    "Cat",
    "Dog",
    "Moon",
    "Star",
    "Cloud",
    "Sun",
    "Car",
    "Fish",
    "Flower",
    "Book",
    "Cake",
    "Hat",
    "Key",
    "Heart"
];

const hardPrompts = [
    "Guitar",
    "Bird",
    "Boat",
    "Train",
    "Castle",
    "Lamp",
    "Pineapple",
    "Spider",
    "Rocket",
    "Banana",
    "Cup",
    "Bicycle",
    "Robot",
    "Balloon",
    "Candle",
    "Football",
    "Butterfly",
    "Clock",
    "Cupcake",
    "Pencil",
    "Skateboard",
    "Umbrella",
    "Popcorn"
];

const easyPrompt = easyPrompts[Math.floor(Math.random() * easyPrompts.length)];
const winText = winMessages[Math.floor(Math.random() * winMessages.length)];
const hardPrompt = hardPrompts[Math.floor(Math.random() * hardPrompts.length)];


let guesses = "";

let timerInterval; 
let elapsedTime = 0;
let gameMode;

var confettiSettings = { target: 'drawing-board' };
var confetti = new ConfettiGenerator(confettiSettings);

// Toolbar actions
toolbar.addEventListener("click", (e) => {
    if (e.target.id === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (e.target.id === "erase") {
        ctx.globalCompositeOperation = "destination-out";
    }
    if (e.target.id === "draw") {
        ctx.globalCompositeOperation = "source-over";
        strokeColor = "black";
    }
});


popup.addEventListener("click", (e) => {
    if (e.target.id === "export") {
        // Create a temporary link to trigger download
        const link = document.createElement("a");
        link.href = currentImage;
        link.download = "canvas_image.png"; // Name of the file
        link.click();
    }
});

// Brush preview movement
canvas.addEventListener("mousemove", (e) => {
    // Update brush preview position
    brushPreview.style.left = `${e.clientX}px`;
    brushPreview.style.top = `${e.clientY}px`;
});

// Show and hide brush preview
canvas.addEventListener("mouseenter", () => {
    brushPreview.style.display = "block";
});
canvas.addEventListener("mouseleave", () => {
    brushPreview.style.display = "none";
});

// Drawing logic
canvas.addEventListener("mousedown", (e) => {
    console.log(timerStart);
    console.log(select);
    if(!timerStart) {
        if (!select) {
            startTimer();
        }
        
    }
    isPainting = true;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth; // Ensure brush size matches
});

canvas.addEventListener("mouseup", () => {
    isPainting = false;
    ctx.stroke();
    ctx.beginPath();
});
canvas.addEventListener("mousemove", (e) => {
    if (!isPainting) return;
    ctx.lineCap = "round";
    ctx.lineTo(e.clientX - canvasOffsetX, e.clientY);
    ctx.stroke();
});
// Start drawing
const startDrawing = (x, y) => {
    isDrawing = true;
    [lastX, lastY] = [x, y];
};

// Draw on canvas
const draw = (x, y) => {
    if (!isDrawing) return;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
};

// Stop drawing
const stopDrawing = () => {
    isDrawing = false;
    ctx.closePath();
};
// Event handlers for touch
canvas.addEventListener("touchstart", (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if(!timerStart) {
        if (!select) {
            startTimer();
        }
    }
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
    e.preventDefault(); // Prevent scrolling
});

canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
    e.preventDefault(); // Prevent scrolling
});

canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchcancel", stopDrawing);

function hasImageChanged(currentImage) {
    return currentImage !== oldImage;  // Compare current and previous base64 data
}

async function sendtoAI() {
    console.log("Testing");
    currentImage = canvas.toDataURL("image/png");
    const now = Date.now();
    if (select == true) {
        responsetext.textContent = "Select a mode to begin";
        return;
    }
    if (finished || !timerStart) {
        return;
    }
    if (now - lastSentTime < API_LIMIT_INTERVAL) {
        responsetext.textContent = "AI Response: Thinking...";
        console.log("Waiting to avoid rate limit...");
        return; // Exit if too soon
    }
    if (!hasImageChanged(currentImage)) {
        console.log("No change in the image, not sending.");
        responsetext.textContent = "Make some changes!";
        return; // Skip sending if no change
    }
    console.log("Image has changed, sending to AI...");
    oldImage = currentImage;
    lastSentTime = now;
    let messageContent = `You are an AI tasked with playing Pictionary with a human. Attached is the current drawing of the human. Respond in one word what you think you see. ONLY ONE WORD. You have already guessed ${guesses} and it is not that.`;

    if (gameMode == "normal") {
        messageContent += ` Possible guesses include: ${easyPrompts.join(", ")}`;
    }
    const base64Image = currentImage.replace(/^data:image\/png;base64,/, "");
    const response1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama-3.2-90b-vision-preview",
            messages: [
              {
                "role": "user",
                "content": [
                  {
                    "type": "text",
                    "text": messageContent,
                  },
                  {
                    "type": "image_url",
                    "image_url": {
                      "url": `data:image/jpeg;base64,${base64Image}`
                    }
                  }
                ]
              }
            ]
        })
    });

    const data1 = await response1.json();
    console.log('First response:', data1);
    if (!response1.ok || !data1.choices?.[0]?.message?.content) {
        throw new Error(data1.error?.message || 'Invalid response from API');
    }
    let airesponse = data1.choices[0].message.content
    console.log(airesponse);
    responsetext.textContent = "AI Response: " + airesponse;
    if (airesponse.toLowerCase().includes(prompt_text.textContent.toLowerCase())) {
        endTimer();
        win.textContent = winText;
        popup.classList.add('active');
        finished = true;
        confetti.render();
    }
    else {
        guesses += airesponse + ", "
    }
}

// Slider input: update brush size and preview
slider.addEventListener("input", function () {
    sizeValue.textContent = this.value; // Update the displayed size value
    lineWidth = parseInt(this.value, 10);
    updateBrushPreview(); // Update preview size
});

function startTimer() {
    const timerDisplay = document.getElementById("timerDisplay"); // Assuming you have an element to show the timer
    timerStart = true;
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Start a new timer
    timerInterval = setInterval(() => {
        elapsedTime++;
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;

        // Update the display
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function endTimer() {
    // Stop the timer
    clearInterval(timerInterval);
    timerInterval = null;
    timerStart = false;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    // Optionally, reset elapsed time or log it
    console.log(`Timer stopped at ${elapsedTime} seconds.`);
    timerSet.textContent = "Your time: "+ `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clearTimer() {
    // Stop the timer
    clearInterval(timerInterval);
    timerInterval = null;
    timerStart=false;

    // Reset elapsed time
    elapsedTime = 0;

    // Update the display
    const timerDisplay = document.getElementById("timerDisplay");
    timerDisplay.textContent = "0:00"; // Reset the display to the default time format
}

//Color picker

document.addEventListener("DOMContentLoaded", () => {
    const modeSelect = document.getElementById("mode");
    const colorOptions = document.getElementById("color-picker");
    const colorRadios = document.querySelectorAll('input[name="color"]');

    modeSelect.addEventListener("change", () => {
        if (modeSelect.value === "normal") {
            gameMode = "normal";
            reload.classList.remove("hide");
            reload.classList.add('show');
            prompt_text.textContent = easyPrompt;
            clearTimer();
            colorOptions.style.display = "block";
            select=false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            responsetext.textContent = "Start drawing to begin"
        } else if (modeSelect.value === "hard") {
            gameMode = "hard";
            reload.classList.remove("hide");
            reload.classList.add('show');
            prompt_text.textContent = hardPrompt;
            clearTimer();
            colorOptions.style.display = "none";
            select=false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            responsetext.textContent =  "Start drawing to begin"
        }
        else {
            reload.classList.remove("show");
            reload.classList.add('hide');
            colorOptions.style.display = "none";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            clearTimer();
            select=true;
            prompt_text.textContent = "Select a mode to start";

        }
    });

    colorRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
            strokeColor = radio.value; // Update stroke color
            console.log(`Color changed to: ${strokeColor}`);
        });
    });
});


// Periodic AI sending
setInterval(() => {
    if (!finished) {
    sendtoAI();
    }
}, 5000);
