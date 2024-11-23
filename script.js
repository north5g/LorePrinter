// Replace with Lorcana API endpoint for the full collection
const API_URL = 'https://api.lorcana-api.com/bulk/cards';

const searchBox = document.getElementById('searchBox');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const generatePdfButton = document.getElementById('generatePdf');

const selectedCardsDiv = document.createElement('div');
selectedCardsDiv.id = 'selectedCards';
document.getElementById('app').appendChild(selectedCardsDiv);

let allCards = []; // Store all cards from the API
let selectedCards = []; // Store selected cards

// Fetch all cards from the Lorcana API on page load
async function fetchAllCards() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch cards');
    const data = await response.json();

    // Extract only the name and image fields
    allCards = data.map(card => ({
      Name: card.Name,
      Image: card.Image
    }));

    displayResults(allCards); // Display the filtered cards
  } catch (error) {
    console.error('Error fetching cards:', error);
    resultsDiv.innerHTML = '<p>Failed to load cards. Please try again later.</p>';
  }
}

// Display filtered results based on search query
function filterResults(query) {
  const filteredCards = allCards.filter(card =>
    card.Name.toLowerCase().includes(query.toLowerCase())
  );
  displayResults(filteredCards);
}

// Display results (filtered or full collection)
function displayResults(cards) {
  resultsDiv.innerHTML = '';

  if (cards.length === 0) {
    resultsDiv.innerHTML = '<p>No cards found.</p>';
    return;
  }

  cards.forEach(card => {
    const img = document.createElement('img');
    img.src = card.Image; // Assuming the API provides an `image` field
    img.alt = card.Name;
    img.title = card.Name;
    img.style.cursor = 'pointer';

    img.onclick = () => toggleCardSelection(card);
    resultsDiv.appendChild(img);
  });
}

// Add card to the selected list and update display
function toggleCardSelection(card) {
  selectedCards.push(card);
  generatePdfButton.disabled = selectedCards.length === 0;
  displaySelectedCards();
}

// Display selected cards dynamically
function displaySelectedCards() {
  selectedCardsDiv.innerHTML = '<h2>Selected Cards</h2>';

  if (selectedCards.length === 0) {
    selectedCardsDiv.innerHTML += '<p>No cards selected.</p>';
    return;
  }

  selectedCards.forEach((card, index) => {
    const img = document.createElement('img');
    img.src = card.Image;
    img.alt = card.Name;
    img.title = card.Name;
    img.style.cursor = 'pointer';

    img.onclick = () => {
      selectedCards.splice(index, 1);
      generatePdfButton.disabled = selectedCards.length === 0;
      displaySelectedCards();
    };

    selectedCardsDiv.appendChild(img);
  });
}

// Generate PDF from selected cards
function generatePdf() {
  const pdf = new jsPDF();

  selectedCards.forEach((card, index) => {
    if (index % 9 === 0) pdf.addPage();
    pdf.addImage(card.Image, 'JPEG', 10, 20, 90, 120)

  });

  pdf.save('lorcana-proxies.pdf');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchAllCards); // Fetch cards on load
searchBox.addEventListener('input', () => filterResults(searchBox.value));
generatePdfButton.onclick = generatePdf;
