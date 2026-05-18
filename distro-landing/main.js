// Navbar state on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Scroll Reveal Logic
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// AI Simulation Controller
const simulationText = document.getElementById('simulation-text');
const aiProcessing = document.getElementById('ai-processing');
const orderResult = document.getElementById('order-result');
const chatBubble = document.getElementById('chat-bubble');

const phrases = [
    {
        input: '"Chốt cho chị Lan Chợ Bà Chiểu 10 thùng Tiger, giao sáng mai nha em!"',
        name: 'Chị Lan - Chợ Bà Chiểu',
        product: '10 thùng Bia Tiger',
        time: 'Sáng mai (14/05)'
    },
    {
        input: '"Giao 5 thùng sữa hạt Sen cho Nhà thuốc An Nhiên, số 123 Lê Lợi."',
        name: 'Nhà thuốc An Nhiên',
        product: '5 thùng Sữa Hạt Sen',
        time: 'Trong ngày hôm nay'
    }
];

let currentPhraseIndex = 0;

function typeWriter(text, i, callback) {
    if (i < text.length) {
        simulationText.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        setTimeout(() => typeWriter(text, i + 1, callback), 40);
    } else {
        setTimeout(callback, 800);
    }
}

async function runSimulation() {
    const data = phrases[currentPhraseIndex];
    
    // Reset state
    orderResult.style.display = 'none';
    aiProcessing.style.display = 'none';
    chatBubble.style.opacity = '1';
    simulationText.innerHTML = '';
    
    // 1. Type the message
    await new Promise(resolve => typeWriter(data.input, 0, resolve));
    
    // 2. Show processing
    aiProcessing.style.display = 'flex';
    aiProcessing.classList.add('reveal', 'active');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Show result
    aiProcessing.style.display = 'none';
    orderResult.style.display = 'block';
    orderResult.classList.add('reveal', 'active');
    
    // Fill data
    document.getElementById('res-name').textContent = data.name;
    document.getElementById('res-product').textContent = data.product;
    document.getElementById('res-time').textContent = data.time;
    
    // 4. Cycle to next
    currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
    
    setTimeout(runSimulation, 6000);
}

// Start simulation when hero is visible
const heroSection = document.querySelector('#hero');
const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        runSimulation();
        heroObserver.disconnect();
    }
}, { threshold: 0.5 });

heroObserver.observe(heroSection);
