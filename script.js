// Replace with Lorcana API endpoint for the full collection
const API_URL = 'https://api.lorcana-api.com/bulk/cards';
const localImages = './images/'; // Local image folder
const { PDFDocument } = PDFLib;

const searchBox = document.getElementById('searchBox');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const generatePdfButton = document.getElementById('generatePdf');
const loadingText = document.getElementById('loadingText');

const selectedCardsDiv = document.getElementById('selectedCards');
const selectedWordsDiv = document.getElementById('selectedWords');

let allCards = []; // Store all cards from the API
let selectedCards = []; // Store selected cards (can include duplicates)

// Fetch all cards from the Lorcana API on page load
async function fetchAllCards() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch cards');
    const data = await response.json();

    // Extract only the name and image fields, modifying image URL for local storage
    allCards = data.map(card => ({
      Name: card.Name,
      Image: localImages + card.Image.split('/').pop() // Use the last part of the URL as the image file name
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
    img.src = card.Image; // Use the local image path
    img.alt = card.Name;
    img.title = card.Name;
    img.id = "card-img";

    img.onclick = () => toggleCardSelection(card);
    resultsDiv.appendChild(img);
  });
}

// Add card to the selected list and update display
function toggleCardSelection(card) {
  selectedCards.push(card); // Allow duplicates
  generatePdfButton.disabled = selectedCards.length === 0;
  displaySelectedCards();
}

// Display selected cards dynamically
function displaySelectedCards() {

  if (selectedCards.length === 0) {
    selectedCardsDiv.innerHTML = ''
    selectedWordsDiv.innerHTML = '<p>No cards selected</p>';
    return;
  }
  

  selectedWordsDiv.innerHTML = ''
  // Display all selected cards (including duplicates)
  selectedCardsDiv.innerHTML = selectedCards
    .map((card, index) => `
      <img 
        src="${card.Image}" 
        alt="${card.Name}" 
        title="${card.Name}" 
        id="card-img" 
        onclick="removeCard(${index})"
      />
    `)
    .join('');
}

// Remove a card by index (removes the specific instance of the card)
function removeCard(index) {
  selectedCards.splice(index, 1); // Remove the card at the given index
  generatePdfButton.disabled = selectedCards.length === 0;
  displaySelectedCards();
}

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// Toggle the sidebar on button click
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
  sidebarToggle.classList.toggle('active');
});

// Generate PDF 
async function generatePdf() {
  if (selectedCards.length === 0) return;

  
  generatePdfButton.classList.add("loading");
  loadingText.innerHTML = "Loading <span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>";

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(); // Start with the first page
  let index = 0;
  // Define constants for image positioning (3x3 grid per page)
  const imagesPerPage = 9; // 3x3 grid (3 images per row, 3 rows per page)
  const imagesPerRow = 3;  // Number of images per row
  const imageWidth = 63;   // Fixed image width
  const imageHeight = 88;  // Fixed image height
  const xOffset = 13.45;   // No horizontal spacing
  const yOffset = 7.7;     // No vertical spacing
  const mmToPt = 2.83465;
  let currentColumn = 0;
  for (const card of selectedCards) {
    try {
      // Fetch the image from the local path
      const localImagePath = card.Image;
      const response = await fetch(localImagePath);
      const imageBytes = await response.arrayBuffer();
      // Embed the image into the PDF
      const pngImage = await pdfDoc.embedPng(imageBytes);
      // Calculate the position for this image
      const xPos = xOffset + (index % imagesPerRow) * imageWidth; // Position horizontally
      const yPos = yOffset + currentColumn * imageHeight; // Position vertically
      // Draw the image on the current page
      page.drawImage(pngImage, {
        x: xPos * mmToPt,
        y: yPos * mmToPt,
        width: imageWidth * mmToPt,
        height: imageHeight * mmToPt,
      });
      // Check if we need to add a new page (after every 9 images)
      if ((index + 1) % 3 === 0) {
        currentColumn += 1;
      }
      if ((index + 1) % imagesPerPage === 0) {
        page = pdfDoc.addPage(); // Add a new page
        currentColumn = 0;
      }
      index += 1;
      
    } catch (err) {
      console.error(`Failed to add image for card: ${card.Name}`, err);
    }
  }

  // Serialize the PDF and trigger a download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');

  loadingText.textContent = "Generate PDF";
  generatePdfButton.classList.remove("loading");
} 

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchAllCards); // Fetch cards on load
searchBox.addEventListener('input', () => filterResults(searchBox.value));
generatePdfButton.addEventListener('click', generatePdf); // Attach correct function